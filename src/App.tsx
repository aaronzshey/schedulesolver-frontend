import React, { useState } from 'react';

export default function CalendarMVP() {
  // 1. One single state for the dummy input box
  const [userInput, setUserInput] = useState("Alice: DevOps\nBob: Backend, Database\nAlice: DevOps = Monday");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(3);
  
  // 2. TypeScript fixes applied
  const [calendarDays, setCalendarDays] = useState<any[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [error, setError] = useState<any>(null);

  const handleGenerate = async (e: any) => {
    e.preventDefault();
    setIsSolving(true);
    setHasGenerated(false);
    setError(null);

    // 3. The Magic Trick: We parse nothing. We just wait a second for dramatic effect.
    try {
      const response = await fetch('https://schedulesolver-api.onrender.com/solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Sending completely empty constraints to the API
        body: JSON.stringify({ 
            year: parseInt(year.toString()), 
            month: parseInt(month.toString()), 
            people: {}, 
            constraints: [] 
        })
      });

      if (!response.ok) throw new Error("API Connection Failed. Is the Flask server running?");
      
      const csvText = await response.text();
      
      // Parse the CSV returned by Python
      const rows = csvText.split('\n').map(row => row.split(',')).filter(row => row.length === 3);
      rows.shift(); // Remove header
      
      const daysInMonth = new Date(year, month, 0).getDate();
      const days = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, tasks: [] as any[] }));
      
      rows.forEach(([d, person, task]) => {
        const dayNum = parseInt(d);
        if (dayNum && days[dayNum - 1]) {
          days[dayNum - 1].tasks.push({ person: person.trim(), task: task.trim() });
        }
      });

      setCalendarDays(days);
      setHasGenerated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSolving(false);
    }
  };

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];

  return (
    <div style={{ fontSize: '18px', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', maxWidth: '1000px', margin: '40px auto', padding: '0 20px', color: '#000000', backgroundColor: '#ffffff', minHeight: '100vh' }}>
        <h1 style={{ margin: 0, fontSize: '32px', fontWeight: 'bold' }}>Schedule Solver</h1>

      {error && <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', padding: '12px', marginBottom: '20px', border: '1px solid #991b1b' }}>{error}</div>}

      {/* 4. The unified, fake text area */}
      <section>
        <textarea
          value={userInput} onChange={(e) => setUserInput(e.target.value)}
          style={{ width: '100%', height: '150px', padding: '12px', border: '1px solid #000', fontFamily: 'inherit', resize: 'vertical', fontSize:'18px' }}
          placeholder="Type here"
        />
      </section>

      <div style={{ display: 'flex', gap: '10px'}}>
        <input type="number" value={month} onChange={(e) => setMonth(Number(e.target.value))} min="1" max="12" style={{ padding: '10px', border: '1px solid #000', width: '80px' }} title="Month" />
        <input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ padding: '10px', border: '1px solid #000', width: '100px' }} title="Year" />
        <button 
          onClick={handleGenerate} disabled={isSolving}
          style={{ backgroundColor: isSolving ? '#f0f0f0' : '#000000', color: isSolving ? '#888888' : '#ffffff', padding: '10px 24px', border: '1px solid #000000', fontWeight: 'bold', cursor: isSolving ? 'wait' : 'pointer', flexGrow: 1 }}
        >
          {isSolving ? 'Solving OR-Tools Model...' : 'Run Solver'}
        </button>
      </div>

      {hasGenerated && !isSolving && (
        <section>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '0', borderTop: '1px solid #000', borderLeft: '1px solid #000' }}>
            {daysOfWeek.map(day => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 'bold', padding: '10px', borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>{day}</div>
            ))}
            
            {calendarDays.map(({ day, tasks }) => (
              <div key={day} style={{ minHeight: '120px', padding: '8px', borderBottom: '1px solid #000', borderRight: '1px solid #000' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', paddingBottom: '4px' }}>{day}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {tasks.map((t, idx) => (
                    <div key={idx} style={{ fontSize: '12px', border: '1px solid #e0e0e0', padding: '4px 6px', backgroundColor: '#f9f9f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <strong>{t.person}:</strong> {t.task}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
