import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = 'http://localhost:8080/api';

function App() {
  const [isAdminView, setIsAdminView] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [applications, setApplications] = useState([]);
  
  const [formData, setFormData] = useState({
    full_name: '', phone: '', email: '', discord: '', school: '', birth_date: ''
  });
  const [file, setFile] = useState(null);

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`${API_URL}/applications.php`);
      setApplications(Array.isArray(res.data) ? res.data : []);
    } catch (err) { 
      console.error("Ошибка загрузки данных:", err); 
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    // ПРОВЕРКА НА 16 ЛЕТ
    const birthDate = new Date(formData.birth_date);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (age < 16) {
      alert("⚠️ Регистрация доступна только для участников старше 16 лет!");
      return;
    }

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (file) data.append('screenshot', file);

    try {
      await axios.post(`${API_URL}/register.php`, data);
      alert("✅ Заявка успешно отправлена!");
      e.target.reset();
      setFormData({ full_name: '', phone: '', email: '', discord: '', school: '', birth_date: '' });
      setFile(null);
    } catch (err) { 
      alert("Ошибка при отправке. Проверьте соединение с сервером."); 
    }
  };

  // ФУНКЦИЯ ОБНОВЛЕНИЯ СТАТУСА (Approved/Rejected)
  const updateStatus = async (id, newStatus) => {
    try {
      const response = await axios.post(`${API_URL}/update_status.php`, {
        id: id,
        status: newStatus
      });

      if (response.data.success) {
        // Мгновенно обновляем состояние в интерфейсе
        setApplications(prev => 
          prev.map(app => app.id === id ? { ...app, status: newStatus } : app)
        );
      } else {
        alert("Ошибка сервера: " + response.data.error);
      }
    } catch (err) {
      alert("Ошибка при связи с сервером MySQL");
    }
  };

  const handleAdminLogin = () => {
    if (adminPassword === 'admin123') {
      setIsLogged(true);
      fetchApplications();
    } else {
      alert("Неверный пароль!");
    }
  };

  return (
    <div className="container">
      <header className="main-header">
        <div className="logo">FREE FIRE <span>ELITE</span></div>
        <button onClick={() => setIsAdminView(!isAdminView)} className="btn-ghost">
          {isAdminView ? 'На главную' : 'Панель админа'}
        </button>
      </header>

      {!isAdminView ? (
        <div className="registration-section">
          <div className="hero-text">
            <h1>BIG TOURNAMENT 2026</h1>
            <p>Докажи, что ты лучший. Регистрация открыта для игроков 16+</p>
          </div>

          <form onSubmit={handleRegister} className="modern-form">
            <h2>Регистрация участника</h2>
            <div className="input-grid">
              <input type="text" placeholder="Полное ФИО" required onChange={e => setFormData({...formData, full_name: e.target.value})} />
              <input type="tel" placeholder="Номер телефона" required onChange={e => setFormData({...formData, phone: e.target.value})} />
              <input type="email" placeholder="Электронная почта" required onChange={e => setFormData({...formData, email: e.target.value})} />
              <input type="text" placeholder="Discord (User#0000)" required onChange={e => setFormData({...formData, discord: e.target.value})} />
              <input type="text" placeholder="Учебное заведение" required className="full-width" onChange={e => setFormData({...formData, school: e.target.value})} />
              <div className="date-input">
                <label>Дата рождения</label>
                <input type="date" required onChange={e => setFormData({...formData, birth_date: e.target.value})} />
              </div>
              <div className="file-input">
                <label>Скриншот профиля</label>
                <input type="file" accept="image/*" required onChange={e => setFile(e.target.files[0])} />
              </div>
            </div>
            <button type="submit" className="btn-primary">ПОДАТЬ ЗАЯВКУ</button>
          </form>
        </div>
      ) : (
        <div className="admin-section">
          {!isLogged ? (
            <div className="login-card">
              <h2>Админ-панель</h2>
              <input type="password" placeholder="Введите пароль" onChange={e => setAdminPassword(e.target.value)} />
              <button onClick={handleAdminLogin} className="btn-primary">Войти</button>
            </div>
          ) : (
            <div className="table-container">
              <h2>Управление заявками</h2>
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>ФИО</th>
                    <th>Контакты</th>
                    <th>Школа</th>
                    <th>Дата рожд.</th>
                    <th>Скриншот</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map(app => (
                    <tr key={app.id}>
                      <td data-label="ФИО">{app.full_name}</td>
                      <td data-label="Контакты">
                        <div className="contact-info">
                          <span>📱 {app.phone}</span>
                          <span>💬 {app.discord}</span>
                        </div>
                      </td>
                      <td data-label="Школа">{app.school}</td>
                      <td data-label="Дата рожд.">{app.birth_date}</td>
                      <td data-label="Скриншот">
                        <a href={`${API_URL}/../uploads/${app.screenshot}`} target="_blank" rel="noreferrer" className="view-link">Открыть фото</a>
                      </td>
                      <td data-label="Статус">
                        <span className={`status-pill ${app.status}`}>{app.status}</span>
                      </td>
                      <td data-label="Действия" className="actions">
                        <button onClick={() => updateStatus(app.id, 'approved')} className="btn-approve">Принять</button>
                        <button onClick={() => updateStatus(app.id, 'rejected')} className="btn-reject">Отклонить</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;