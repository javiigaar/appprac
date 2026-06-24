import React, { useState, useEffect } from 'react';

export default function App() {
  const [practices, setPractices] = useState([]);
  const [payments, setPayments] = useState([]); // Historial de pagos realizados
  
  // Estados del formulario
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [cost, setCost] = useState('32.37'); // Precio predeterminado

  // Cargar datos de la memoria local al arrancar (PERSISTENCIA)
  useEffect(() => {
    const savedPractices = JSON.parse(localStorage.getItem('mis_practicas_react')) || [];
    const savedPayments = JSON.parse(localStorage.getItem('mis_pagos_react')) || [];
    setPractices(savedPractices);
    setPayments(savedPayments);
  }, []);

  // Guardar datos automáticamente cuando haya cualquier cambio (PERSISTENCIA)
  useEffect(() => {
    localStorage.setItem('mis_practicas_react', JSON.stringify(practices));
    localStorage.setItem('mis_pagos_react', JSON.stringify(payments));
  }, [practices, payments]);

  // Ordenar cronológicamente las prácticas para asignarles su número real
  const sortedPractices = [...practices].sort((a, b) => {
    return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
  });

  // Evaluar en tiempo real el estado de cada práctica según el reloj actual
  const now = new Date(); // Aquí está definido el reloj actual
  const practicesWithStatus = sortedPractices.map((p, index) => {
    const practiceDateTime = new Date(`${p.date}T${p.time}`);
    const isCompleted = practiceDateTime <= now; // AUTOMÁTICO: Si ya pasó la hora, está realizada
    return {
      ...p,
      displayNumber: index + 1,
      isCompleted
    };
  });

  // Determinar si la siguiente práctica a añadir estará incluida (las 5 primeras cronológicas)
  const isIncluded = practices.length < 5;

  const handleAddPractice = () => {
    if (!date || !time) {
      alert("Por favor, selecciona una fecha y una hora.");
      return;
    }
    
    const newPractice = {
      id: Date.now().toString(),
      date,
      time,
      isIncluded: isIncluded,
      cost: isIncluded ? 0 : parseFloat(cost || 32.37),
      isPaid: isIncluded // Las 5 primeras ya están pagadas (incluidas)
    };

    setPractices([...practices, newPractice]);
    
    // Limpiar formulario
    setDate('');
    setTime('');
    setCost('32.37');
  };

  // --- CÁLCULO DE DEUDAS (Solo prácticas realizadas y no pagadas) ---
  const payablePractices = practicesWithStatus.filter(p => !p.isPaid && p.isCompleted);
  const totalDebt = payablePractices.reduce((sum, p) => sum + p.cost, 0);

  // Registrar pago de golpe
  const handlePayBatch = () => {
    if (payablePractices.length === 0) return;
    
    const practiceNumbers = payablePractices.map(p => `Nº ${p.displayNumber}`);
    const textNumbers = practiceNumbers.join(', ');

    if (window.confirm(`¿Confirmas el pago de las prácticas acumuladas (${textNumbers}) por un total de ${totalDebt.toFixed(2).replace('.', ',')}€?`)) {
      
      // 1. Crear el recibo de pago
      const newReceipt = {
        id: Date.now().toString(),
        dateOfPayment: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        amount: totalDebt,
        practicesPaid: textNumbers
      };

      // 2. Marcar esas prácticas específicas como pagadas
      const payableIds = payablePractices.map(p => p.id);
      const updatedPractices = practices.map(p => {
        if (payableIds.includes(p.id)) {
          return { ...p, isPaid: true };
        }
        return p;
      });

      setPractices(updatedPractices);
      setPayments([newReceipt, ...payments]); // Añadir el recibo arriba en el historial
    }
  };

  const handleClearAll = () => {
    if (window.confirm("¿Seguro que quieres resetear por completo la app? Se borrarán prácticas e historial de pagos.")) {
      setPractices([]);
      setPayments([]);
    }
  };

  // --- CONTROLES DEL CALENDARIO ---
  // SOLUCIÓN DEL ERROR: Usamos "now" que definimos más arriba
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); 
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const savedDates = practices.map(p => p.date);
  const calendarDays = Array.from({ length: startOffset }).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  // --- ESTILOS EN LÍNEA OPTIMIZADOS PARA MÓVIL ---
  const styles = {
    container: { fontFamily: '-apple-system, sans-serif', maxWidth: '400px', margin: '0 auto', padding: '15px', backgroundColor: '#f2f2f7', minHeight: '100vh', boxSizing: 'border-box' },
    card: { backgroundColor: 'white', padding: '18px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '5px', textAlign: 'center', marginTop: '10px' },
    dayName: { fontWeight: 'bold', color: '#888', fontSize: '0.75rem' },
    day: { padding: '10px 0', borderRadius: '8px', backgroundColor: '#f9f9f9', fontSize: '0.9rem' },
    highlightDay: { backgroundColor: '#ff3b30', color: 'white', fontWeight: 'bold' },
    emptyDay: { backgroundColor: 'transparent' },
    label: { display: 'block', marginBottom: '5px', color: '#444', fontSize: '0.85rem', fontWeight: '600' },
    input: { width: '100%', padding: '11px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '1rem', backgroundColor: '#fff' },
    button: { width: '100%', padding: '12px', backgroundColor: '#007aff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' },
    payButton: { width: '100%', padding: '12px', backgroundColor: '#34c759', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '0.95rem' },
    listItem: { padding: '12px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    receiptItem: { padding: '10px 0', borderBottom: '1px solid #eee', fontSize: '0.9rem' },
    badgeIncluded: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' },
    badgePaid: { backgroundColor: '#e3f2fd', color: '#1565c0', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' },
    badgeUnpaid: { backgroundColor: '#ffebee', color: '#c62828', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' },
    deleteBtn: { backgroundColor: 'transparent', color: '#ff3b30', border: 'none', width: '100%', padding: '10px', marginTop: '10px', cursor: 'pointer', fontSize: '0.9rem' }
  };

  return (
    <div style={styles.container}>
      
      {/* 1. CALENDARIO */}
      <div style={styles.card}>
        <h2 style={{ margin: 0, fontSize: '1.2rem' }}>🗓️ {monthNames[currentMonth]} {currentYear}</h2>
        <div style={styles.grid}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} style={styles.dayName}>{d}</div>)}
          {calendarDays.map((day, index) => {
            if (!day) return <div key={index} style={styles.emptyDay}></div>;
            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isPracticeDay = savedDates.includes(dateString);
            return <div key={index} style={{...styles.day, ...(isPracticeDay ? styles.highlightDay : {})}}>{day}</div>;
          })}
        </div>
      </div>

      {/* 2. PANEL DE CONTROL DE CUENTAS */}
      <div style={{...styles.card, border: payablePractices.length >= 5 ? '2px solid #ff3b30' : 'none'}}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>💰 Control de Cuentas</h2>
        {practices.length < 5 ? (
          <div style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '8px', color: '#2e7d32', fontSize: '0.9rem', textAlign: 'center' }}>
            Bono inicial activo: Te quedan <strong>{5 - practices.length} prácticas gratis</strong>.
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95rem' }}>
              <span>Clases hechas sin pagar:</span>
              <strong style={{ color: payablePractices.length >= 5 ? '#ff3b30' : '#333' }}>
                {payablePractices.length} / 5 acumuladas
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span>Importe adeudado actual:</span>
              <strong style={{ color: payablePractices.length >= 5 ? '#ff3b30' : '#34c759', fontSize: '1.05rem' }}>
                {totalDebt.toFixed(2).replace('.', ',')} €
              </strong>
            </div>
            {payablePractices.length > 0 && (
              <button 
                onClick={handlePayBatch} 
                style={{...styles.payButton, backgroundColor: payablePractices.length >= 5 ? '#ff3b30' : '#34c759'}}
              >
                {payablePractices.length >= 5 ? '⚠️ ¡Límite alcanzado! Registrar Pago ya' : 'Pagar clases hechas de golpe'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. FORMULARIO */}
      <div style={styles.card}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Añadir Práctica Nº {practices.length + 1}</h2>
        <div>
          <label style={styles.label}>Fecha de la clase:</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
        </div>
        <div>
          <label style={styles.label}>Hora acordada:</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={styles.input} />
        </div>
        {!isIncluded && (
          <div>
            <label style={styles.label}>Precio de la clase (€):</label>
            <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} style={styles.input} />
          </div>
        )}
        <button onClick={handleAddPractice} style={styles.button}>Guardar Práctica</button>
      </div>

      {/* 4. HISTORIAL DE CLASES */}
      <div style={styles.card}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Historial de Clases ({practicesWithStatus.length})</h2>
        {practicesWithStatus.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.85rem' }}>No hay prácticas registradas.</p>
        ) : (
          practicesWithStatus.map((p) => (
            <div key={p.id} style={styles.listItem}>
              <div>
                <strong>Práctica {p.displayNumber}</strong>
                <span style={{ fontSize: '1.05rem', marginLeft: '6px' }}>{p.isCompleted ? '🚗 Realizada' : '⏳ Programada'}</span>
                <br/>
                <span style={{ color: '#666', fontSize: '0.8rem' }}>
                  {p.date.split('-').reverse().join('/')} - {p.time} hs
                </span>
                <div style={{ marginTop: '4px' }}>
                  {p.isIncluded ? (
                    <span style={styles.badgeIncluded}>🎁 Incluida (Gratis)</span>
                  ) : (
                    <span style={p.isPaid ? styles.badgePaid : styles.badgeUnpaid}>
                      {p.isPaid ? '✅ Pagada' : `⏳ Por pagar: ${p.cost.toFixed(2).replace('.', ',')}€`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 5. HISTORIAL DE RECIBOS DE PAGOS */}
      <div style={styles.card}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem', color: '#1565c0' }}>🧾 Historial de Pagos Realizados ({payments.length})</h2>
        {payments.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.85rem' }}>No se ha registrado ningún pago conjunto todavía.</p>
        ) : (
          payments.map((pay) => (
            <div key={pay.id} style={styles.receiptItem}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', color: '#2e7d32' }}>
                <span>💰 Pago Completado</span>
                <span>+{pay.amount.toFixed(2).replace('.', ',')} €</span>
              </div>
              <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '2px' }}>
                <strong>Fecha:</strong> {pay.dateOfPayment} <br />
                <strong>Clases saldadas:</strong> <span style={{ color: '#007aff' }}>{pay.practicesPaid}</span>
              </div>
            </div>
          ))
        )}
        {practices.length > 0 && (
          <button onClick={handleClearAll} style={styles.deleteBtn}>Borrar y resetear aplicación</button>
        )}
      </div>

    </div>
  );
}