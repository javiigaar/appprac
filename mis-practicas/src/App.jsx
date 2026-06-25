import React, { useState, useEffect } from 'react';

export default function App() {
  const [practices, setPractices] = useState([]);
  const [payments, setPayments] = useState([]); // Historial de recibos de pagos realizados
  
  // Estado para controlar el mes del calendario
  const [viewDate, setViewDate] = useState(new Date());
  
  // Estados del formulario de entrada
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [cost, setCost] = useState('32.37');

  // Estado para controlar qué clase se está editando
  const [editingId, setEditingId] = useState(null);

  // 1. CARGAR DATOS (Persistencia)
  useEffect(() => {
    const savedPractices = JSON.parse(localStorage.getItem('mis_practicas_react')) || [];
    const savedPayments = JSON.parse(localStorage.getItem('mis_pagos_react')) || [];
    setPractices(savedPractices);
    setPayments(savedPayments);
  }, []);

  // 2. GUARDAR DATOS (Persistencia automática)
  useEffect(() => {
    localStorage.setItem('mis_practicas_react', JSON.stringify(practices));
    localStorage.setItem('mis_pagos_react', JSON.stringify(payments));
  }, [practices, payments]);

  const now = new Date();

  // Función auxiliar para obtener el nombre del día de la semana (Lunes, Martes, etc.)
  const getDayOfWeekName = (dateStr) => {
    if (!dateStr) return '';
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return days[d.getDay()];
  };

  // Ordenar cronológicamente para asignar los números reales en la lista
  const sortedPractices = [...practices].sort((a, b) => {
    return new Date(`${a.date}T${a.time}`) - new Date(`${b.date}T${b.time}`);
  });

  // Evaluar estados en tiempo real (Realizada o Programada)
  const practicesWithStatus = sortedPractices.map((p, index) => {
    const practiceDateTime = new Date(`${p.date}T${p.time}`);
    const isCompleted = practiceDateTime <= now;
    return {
      ...p,
      displayNumber: index + 1,
      isCompleted
    };
  });

  // Identificar cuál es la próxima práctica programada en el futuro
  const nextPractice = practicesWithStatus.find(p => !p.isCompleted);

  const isIncluded = practices.length < 5;

  // Guardar nueva práctica o actualizar la existente
  const handleAddPractice = () => {
    if (!date || !time) {
      alert("Por favor, selecciona una fecha y una hora para poder guardar.");
      return;
    }
    
    if (editingId) {
      // MODO EDICIÓN
      const updated = practices.map(p => {
        if (p.id === editingId) {
          return {
            ...p,
            date,
            time,
            cost: p.isIncluded ? 0 : parseFloat(cost || 32.37)
          };
        }
        return p;
      });
      setPractices(updated);
      setEditingId(null);
    } else {
      // MODO NUEVA
      const newPractice = {
        id: Date.now().toString(),
        date,
        time,
        isIncluded: isIncluded,
        cost: isIncluded ? 0 : parseFloat(cost || 32.37),
        isPaid: isIncluded
      };
      setPractices([...practices, newPractice]);
    }
    
    // Limpiar formulario
    setDate('');
    setTime('');
    setCost('32.37');
  };

  // Activar modo edición
  const handleEditClick = (p) => {
    setEditingId(p.id);
    setDate(p.date);
    setTime(p.time);
    setCost(p.isIncluded ? '32.37' : p.cost.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancelar el modo edición
  const handleCancelEdit = () => {
    setEditingId(null);
    setDate('');
    setTime('');
    setCost('32.37');
  };

  // Eliminar una práctica específica
  const handleDeletePractice = (id, number) => {
    if (window.confirm(`¿Seguro que quieres eliminar definitivamente la Práctica Nº ${number}?`)) {
      setPractices(practices.filter(p => p.id !== id));
      if (editingId === id) {
        handleCancelEdit();
      }
    }
  };

  // --- CÁLCULO DE CUENTAS (Dinámico y libre de límites rígidos) ---
  const payablePractices = practicesWithStatus.filter(p => !p.isPaid && p.isCompleted);
  const totalDebt = payablePractices.reduce((sum, p) => sum + p.cost, 0);
  const gratisRestantes = 5 - practices.length < 0 ? 0 : 5 - practices.length;

  // Registrar el pago de golpe
  const handlePayBatch = () => {
    if (payablePractices.length === 0) return;
    const practiceNumbers = payablePractices.map(p => `Nº ${p.displayNumber}`).join(', ');

    if (window.confirm(`¿Confirmas el pago de las prácticas acumuladas (${practiceNumbers}) por un total de ${totalDebt.toFixed(2).replace('.', ',')}€?`)) {
      const newReceipt = {
        id: Date.now().toString(),
        dateOfPayment: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        amount: totalDebt,
        practicesPaid: practiceNumbers
      };

      const payableIds = payablePractices.map(p => p.id);
      const updatedPractices = practices.map(p => payableIds.includes(p.id) ? { ...p, isPaid: true } : p);

      setPractices(updatedPractices);
      setPayments([newReceipt, ...payments]);
    }
  };

  const handleClearAll = () => {
    if (window.confirm("¿Seguro que quieres resetear la aplicación por completo? Se perderán todas tus clases grabadas y los recibos.")) {
      setPractices([]);
      setPayments([]);
      handleCancelEdit();
    }
  };

  // --- CALENDARIO ---
  const changeMonth = (offset) => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
  };

  const currentYear = viewDate.getFullYear();
  const currentMonth = viewDate.getMonth(); 
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  const calendarDays = Array.from({ length: startOffset }).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const editingPracticeNumber = practicesWithStatus.find(p => p.id === editingId)?.displayNumber;

  // --- CLONACIÓN Y MIGRACIÓN DE DATOS (NUEVO) ---
  const handleExportData = () => {
    const dataStr = JSON.stringify({ practices, payments });
    if (practices.length === 0 && payments.length === 0) {
      alert("No tienes datos guardados en esta app para exportar.");
      return;
    }
    navigator.clipboard.writeText(dataStr)
      .then(() => {
        alert("✅ ¡Datos copiados! Cierra esta app vieja, abre la app NUEVA, ve abajo del todo y pulsa el botón azul de 'Pegar Datos'.");
      })
      .catch(() => {
        alert("No se pudo copiar automáticamente. Por favor, copia de forma manual el texto de la siguiente ventana:");
        window.prompt("Copia este código entero:", dataStr);
      });
  };

  const handleImportData = () => {
    const code = window.prompt("Pega aquí el código que has copiado de la aplicación vieja:");
    if (!code) return;
    try {
      const parsed = JSON.parse(code);
      if (parsed.practices || parsed.payments) {
        if (window.confirm("⚠️ ¿Quieres importar estos datos? Se sobrescribirá lo que tengas en esta app por tus clases antiguas.")) {
          setPractices(parsed.practices || []);
          setPayments(parsed.payments || []);
          alert("🎉 ¡Éxito! Tus datos se han mudado correctamente. Ya puedes eliminar de tu pantalla el acceso directo viejo.");
        }
      } else {
        alert("❌ Código no válido.");
      }
    } catch (e) {
      alert("❌ Error al procesar el código. Asegúrate de copiarlo completo de la otra app.");
    }
  };

  // --- ESTILOS ---
  const styles = {
    container: { fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', maxWidth: '400px', margin: '0 auto', padding: '15px', backgroundColor: '#f2f2f7', minHeight: '100vh', boxSizing: 'border-box' },
    card: { backgroundColor: 'white', padding: '18px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' },
    nextClassCard: { backgroundColor: '#e3f2fd', padding: '18px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #bbdefb' },
    formCard: { backgroundColor: editingId ? '#fff9f2' : 'white', padding: '18px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: editingId ? '1px solid #ff9500' : 'none' },
    migrationCard: { backgroundColor: '#fffde7', padding: '18px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', border: '1px solid #fff59d' },
    calHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
    navBtn: { background: '#e5e5ea', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '6px', textAlign: 'center', marginTop: '10px' },
    dayName: { fontWeight: 'bold', color: '#888', fontSize: '0.75rem', paddingBottom: '4px' },
    day: { padding: '9px 0', borderRadius: '8px', backgroundColor: '#f9f9f9', fontSize: '0.9rem', fontWeight: '500', border: '2px solid transparent' },
    highlightDay: { backgroundColor: '#ff3b30', color: 'white', fontWeight: 'bold' },
    todayDay: { borderColor: '#007aff', color: '#007aff', fontWeight: 'bold' },
    emptyDay: { backgroundColor: 'transparent' },
    label: { display: 'block', marginBottom: '5px', color: '#444', fontSize: '0.85rem', fontWeight: '600' },
    input: { width: '100%', padding: '11px', marginBottom: '12px', borderRadius: '8px', border: '1px solid #ccc', boxSizing: 'border-box', fontSize: '1rem', backgroundColor: '#fff' },
    button: { width: '100%', padding: '12px', backgroundColor: editingId ? '#ff9500' : '#007aff', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer' },
    cancelButton: { width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#555', border: 'none', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer', marginTop: '5px' },
    payButton: { width: '100%', padding: '12px', backgroundColor: '#34c759', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '0.95rem' },
    migrationBtn: { width: '100%', padding: '11px', backgroundColor: '#ffa726', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '8px', fontSize: '0.9rem' },
    listItem: { padding: '12px 0', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    listActions: { display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '10px' },
    smallActionBtn: { padding: '6px 10px', borderRadius: '6px', border: '1px solid #ddd', backgroundColor: '#fff', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' },
    receiptItem: { padding: '12px 0', borderBottom: '1px solid #eee', fontSize: '0.9rem' },
    badgeIncluded: { backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' },
    badgePaid: { backgroundColor: '#e3f2fd', color: '#1565c0', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' },
    badgeUnpaid: { backgroundColor: '#ffebee', color: '#c62828', padding: '3px 8px', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 'bold' },
    deleteBtn: { backgroundColor: 'transparent', color: '#ff3b30', border: 'none', width: '100%', padding: '10px', marginTop: '15px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500' }
  };

  return (
    <div style={styles.container}>

      {/* 0. PANEL DE PRÓXIMA CLASE */}
      <div style={styles.nextClassCard}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem', color: '#1565c0' }}>🚀 Tu Próxima Clase</h2>
        {nextPractice ? (
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#1c1c1e' }}>
              Práctica {nextPractice.displayNumber}
            </div>
            <div style={{ color: '#005bb5', marginTop: '6px', fontSize: '1rem', fontWeight: '500' }}>
              📅 {getDayOfWeekName(nextPractice.date)} {nextPractice.date.split('-').reverse().join('/')} a las ⏰ {nextPractice.time} hs
            </div>
          </div>
        ) : (
          <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
            No tienes ninguna práctica futura programada en tu agenda.
          </p>
        )}
      </div>
      
      {/* 1. SECCIÓN CALENDARIO */}
      <div style={styles.card}>
        <div style={styles.calHeader}>
          <button style={styles.navBtn} onClick={() => changeMonth(-1)}>‹</button>
          <h2 style={{ margin: 0, fontSize: '1.15rem', color: '#1c1c1e', fontWeight: '700' }}>
            🗓️ {monthNames[currentMonth]} {currentYear}
          </h2>
          <button style={styles.navBtn} onClick={() => changeMonth(1)}>›</button>
        </div>
        <div style={styles.grid}>
          {['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(d => <div key={d} style={styles.dayName}>{d}</div>)}
          {calendarDays.map((day, index) => {
            if (!day) return <div key={index} style={styles.emptyDay}></div>;
            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = todayStr === dateString;
            const hasPractice = practices.some(p => p.date === dateString);

            let currentDayStyle = { ...styles.day };
            if (hasPractice) currentDayStyle = { ...currentDayStyle, ...styles.highlightDay };
            if (isToday) currentDayStyle = { ...currentDayStyle, ...styles.todayDay };

            return <div key={index} style={currentDayStyle}>{day}</div>;
          })}
        </div>
      </div>

      {/* 2. PANEL DE CONTROL DE PAGOS */}
      <div style={styles.card}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem', color: '#1c1c1e' }}>💰 Control de Cuentas</h2>
        {gratisRestantes > 0 ? (
          <div style={{ padding: '10px', backgroundColor: '#e8f5e9', borderRadius: '8px', color: '#2e7d32', fontSize: '0.9rem', textAlign: 'center', fontWeight: '500' }}>
            Bono inicial activo: Te quedan <strong>{gratisRestantes} clases gratis</strong> incluidas.
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.95rem' }}>
              <span>Clases hechas sin pagar:</span>
              <strong>
                {payablePractices.length} prácticas acumuladas
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem' }}>
              <span>Importe adeudado actual:</span>
              <strong style={{ color: '#34c759', fontSize: '1.05rem' }}>
                {totalDebt.toFixed(2).replace('.', ',')} €
              </strong>
            </div>
            {payablePractices.length > 0 && (
              <button 
                onClick={handlePayBatch} 
                style={styles.payButton}
              >
                Pagar clases hechas de golpe
              </button>
            )}
          </div>
        )}
      </div>

      {/* 3. SECCIÓN FORMULARIO */}
      <div style={styles.formCard}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem', color: editingId ? '#ff9500' : '#1c1c1e' }}>
          {editingId ? `✏️ Modificando Práctica Nº ${editingPracticeNumber}` : `Añadir Práctica Nº ${practices.length + 1}`}
        </h2>
        <div>
          <label style={styles.label}>Fecha de la clase:</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
        </div>
        <div>
          <label style={styles.label}>Hora acordada:</label>
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={styles.input} />
        </div>
        {(!isIncluded && !editingId) && (
          <div>
            <label style={styles.label}>Precio de la clase (€):</label>
            <input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} style={styles.input} />
          </div>
        )}
        <button onClick={handleAddPractice} style={styles.button}>
          {editingId ? 'Actualizar Práctica' : 'Guardar Práctica'}
        </button>
        {editingId && (
          <button onClick={handleCancelEdit} style={styles.cancelButton}>Cancelar edición</button>
        )}
      </div>

      {/* 6. PANEL DE MIGRACIÓN DE DATOS */}
      <div style={styles.migrationCard}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem', color: '#e65100' }}>📦 Clonar / Mudar datos entre Apps</h2>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: '#555', lineHeight: '1.3' }}>
          El iPhone aísla la memoria de cada acceso directo. Para pasar tus clases guardadas a la nueva app con el logo nuevo de golpe:
        </p>
        <button onClick={handleExportData} style={styles.migrationBtn}>
          1. 📤 Copiar datos (Dale desde la APP VIEJA)
        </button>
        <button onClick={handleImportData} style={{...styles.migrationBtn, backgroundColor: '#29b6f6'}}>
          2. 📥 Pegar datos (Dale desde la APP NUEVA)
        </button>
      </div>

      {/* 4. HISTORIAL DE CLASES GRABADAS */}
      <div style={styles.card}>
        <h2 style={{ marginTop: 0, fontSize: '1.1rem', color: '#1c1c1e' }}>Historial de Clases ({practicesWithStatus.length})</h2>
        {practicesWithStatus.length === 0 ? (
          <p style={{ color: '#888', fontSize: '0.85rem' }}>No hay ninguna práctica en el historial.</p>
        ) : (
          [...practicesWithStatus].reverse().map((p) => (
            <div key={p.id} style={{...styles.listItem, opacity: editingId === p.id ? 0.4 : 1}}>
              <div style={{ flex: 1 }}>
                <strong>Práctica {p.displayNumber}</strong>
                <span style={{ fontSize: '1rem', marginLeft: '8px' }}>{p.isCompleted ? '🚗 Realizada' : '⏳ Programada'}</span>
                <br/>
                <span style={{ color: '#666', fontSize: '0.8rem' }}>
                  {getDayOfWeekName(p.date)} {p.date.split('-').reverse().join('/')} - {p.time} hs
                </span>
                <div style={{ marginTop: '5px' }}>
                  {p.isIncluded ? (
                    <span style={styles.badgeIncluded}>🎁 Incluida (Gratis)</span>
                  ) : (
                    <span style={p.isPaid ? styles.badgePaid : styles.badgeUnpaid}>
                      {p.isPaid ? '✅ Pagada' : `⏳ Por pagar: ${p.cost.toFixed(2).replace('.', ',')}€`}
                    </span>
                  )}
                </div>
              </div>
              
              <div style={styles.listActions}>
                <button style={styles.smallActionBtn} onClick={() => handleEditClick(p)}>
                  ✏️ Editar
                </button>
                <button style={{...styles.smallActionBtn, color: '#ff3b30', borderColor: '#ffebee'}} onClick={() => handleDeletePractice(p.id, p.displayNumber)}>
                  🗑️ Borrar
                </button>
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
              <div style={{ color: '#555', fontSize: '0.8rem', marginTop: '3px' }}>
                <strong>Fecha de liquidación:</strong> {pay.dateOfPayment} <br />
                <strong>Clases saldadas:</strong> <span style={{ color: '#007aff', fontWeight: '600' }}>{pay.practicesPaid}</span>
              </div>
            </div>
          ))
        )}
        {(practices.length > 0 || payments.length > 0) && (
          <button onClick={handleClearAll} style={styles.deleteBtn}>Borrar y resetear aplicación</button>
        )}
      </div>

    </div>
  );
}