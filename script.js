/**
     * HACKTOON ARCHITECTURE & STATE MANAGEMENT
     * Banco de dados relacional simulado no LocalStorage
     */
    const DB_KEY = 'HACKTOON_DATABASE_V1';

    // Mock Users para Popular o Ranking Inicial
    const MOCK_USERS = [
      { id: 'u2', name: 'Lucas Silva', score: 850, division: 'Iniciante', weight: 75, targetWeight: 72, consistencyRate: 92 },
      { id: 'u3', name: 'Mariana Costa', score: 1120, division: 'Bronze', weight: 62, targetWeight: 60, consistencyRate: 96 },
      { id: 'u4', name: 'Carlos Eduardo', score: 1450, division: 'Prata', weight: 88, targetWeight: 82, consistencyRate: 88 }
    ];

    // Estrutura Padrão do Estado
    const initialStore = {
      currentUser: {
        id: 'u1',
        name: 'Alex Atleta',
        weight: 80,
        targetWeight: 75,
        calorieGoal: 2200,
        score: 420,
        division: 'Iniciante'
      },
      weightHistory: [
        { date: '2026-09-15', weight: 82.0 },
        { date: '2026-09-22', weight: 81.2 },
        { date: '2026-09-29', weight: 80.5 }
      ],
      executions: [
        { id: 'e1', userId: 'u1', date: '2026-09-28', type: 'forca', name: 'Agachamento', group: 'Pernas', weight: 80, reps: 10, sets: 4, duration: 0, caloriesBurned: 0, vgt: 3200 },
        { id: 'e2', userId: 'u1', date: '2026-09-30', type: 'forca', name: 'Supino Reto', group: 'Peito', weight: 60, reps: 12, sets: 3, duration: 0, caloriesBurned: 0, vgt: 2160 },
        { id: 'e3', userId: 'u1', date: '2026-10-01', type: 'cardio', name: 'Corrida Parque', group: 'Cardio', weight: 0, reps: 0, sets: 0, duration: 30, caloriesBurned: 300, vgt: 0 }
      ],
      meals: [
        { id: 'm1', userId: 'u1', date: '2026-10-01', name: 'Café da Manhã', calories: 450, protein: 25, carbs: 50, fat: 12 },
        { id: 'm2', userId: 'u1', date: '2026-10-01', name: 'Almoço Fit', calories: 750, protein: 45, carbs: 80, fat: 18 }
      ],
      badges: [
        { id: 'b1', name: 'Mestre do Foco', desc: '7 dias na meta calórica', unlocked: true, icon: '🎯' },
        { id: 'b2', name: 'Superação', desc: '3 semanas de Evolução em VGT', unlocked: true, icon: '⚡' },
        { id: 'b3', name: 'Dupla Dinâmica', desc: 'Treino + Meta Proteica no dia', unlocked: false, icon: '🔥' },
        { id: 'b4', name: 'Consistência Elite', desc: 'Alcançar Liga Ouro', unlocked: false, icon: '👑' }
      ]
    };

    // Database Handler
    class Database {
      static load() {
        const data = localStorage.getItem(DB_KEY);
        if (!data) {
          this.save(initialStore);
          return initialStore;
        }
        return JSON.parse(data);
      }

      static save(data) {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
      }
    }

    let store = Database.load();

    /* ==========================================
       LOGICA DE GAMIFICAÇÃO & PONTUAÇÃO
       ========================================== */
    function updateGamificationScore() {
      let score = 0;

      // 1. Pontos por registros de treino
      score += store.executions.length * 30;

      // 2. Pontos por refeições registradas dentro da margem
      score += store.meals.length * 15;

      // 3. Atualizar Divisão
      let division = 'Iniciante';
      if (score >= 1200) division = 'Elite';
      else if (score >= 800) division = 'Ouro';
      else if (score >= 500) division = 'Prata';
      else if (score >= 250) division = 'Bronze';

      store.currentUser.score = score;
      store.currentUser.division = division;

      // Unlocks de Badges
      if (score >= 250) {
        const b = store.badges.find(x => x.id === 'b4');
        if (b) b.unlocked = true;
      }

      Database.save(store);

      // Render Header UI
      document.getElementById('headerScore').innerText = score;
      document.getElementById('headerDivision').innerText = division;
    }

    /* ==========================================
       GRÁFICOS CANVAS LIGHTWEIGHT
       ========================================== */
    function renderLineChart(canvasId, labels, data, color = '#ffcc00') {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;
      const padding = 30;

      ctx.clearRect(0, 0, w, h);

      if (!data || data.length === 0) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.font = '12px Plus Jakarta Sans';
        ctx.fillText('Sem dados registrados', w / 2 - 50, h / 2);
        return;
      }

      const minVal = Math.min(...data) * 0.95;
      const maxVal = Math.max(...data) * 1.05 || 1;

      // Desenhar Grid lines
      ctx.strokeStyle = 'rgba(255, 204, 0, 0.2)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        const y = padding + ((h - padding * 2) / 2) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(w - padding, y);
        ctx.stroke();
      }

      // Traçar Linha
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 3;

      const stepX = (w - padding * 2) / (data.length - 1 || 1);

      data.forEach((val, idx) => {
        const x = padding + idx * stepX;
        const y = h - padding - ((val - minVal) / (maxVal - minVal)) * (h - padding * 2);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Desenhar Pontos
      data.forEach((val, idx) => {
        const x = padding + idx * stepX;
        const y = h - padding - ((val - minVal) / (maxVal - minVal)) * (h - padding * 2);
        
        ctx.fillStyle = '#3d2b56';
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rótulos
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.font = '10px Plus Jakarta Sans';
        if (labels[idx]) {
          ctx.fillText(labels[idx].substring(5), x - 12, h - 8);
        }
      });
    }

    function renderBarChart(canvasId, consumed, burned, goal) {
      const canvas = document.getElementById(canvasId);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const w = rect.width;
      const h = rect.height;

      ctx.clearRect(0, 0, w, h);

      const max = Math.max(consumed, goal + burned, 2000) * 1.1;
      const barWidth = 40;
      const startX = w / 2 - barWidth * 1.5 - 10;

      const items = [
        { label: 'Consumido', val: consumed, color: '#ad00ff' },
        { label: 'Gasto Treino', val: burned, color: '#ff9900' },
        { label: 'Meta Ajust.', val: goal + burned, color: '#ffcc00' }
      ];

      items.forEach((item, i) => {
        const x = startX + i * (barWidth + 20);
        const barHeight = (item.val / max) * (h - 50);
        const y = h - 30 - barHeight;

        // Barra
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, [6, 6, 0, 0]);
        ctx.fill();

        // Rótulo Valor
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Plus Jakarta Sans';
        ctx.fillText(`${Math.round(item.val)}`, x, y - 6);

        // Legenda
        ctx.fillStyle = 'rgba(255, 255, 255, 0.72)';
        ctx.font = '10px Plus Jakarta Sans';
        ctx.fillText(item.label, x - 5, h - 10);
      });
    }

    /* ==========================================
       MÓDULO DE INSIGHTS DINÂMICOS
       ========================================== */
    function generateDynamicInsights() {
      const container = document.getElementById('insightsContainer');
      container.innerHTML = '';

      const insights = [];

      // Análise 1: Volume de Treino x Proteínas
      const highVolumeDays = store.executions.filter(e => e.vgt > 2000).map(e => e.date);
      if (highVolumeDays.length > 0) {
        const mealsOnHighDays = store.meals.filter(m => highVolumeDays.includes(m.date));
        const totalProt = mealsOnHighDays.reduce((acc, m) => acc + m.protein, 0);
        const avgProt = totalProt / (highVolumeDays.length || 1);

        if (avgProt < 80) {
          insights.push({
            title: '⚠️ Alerta de Recuperação Muscular',
            desc: `Nos dias de maior Volume de Treino (VGT > 2000kg), seu consumo médio de proteína foi de apenas ${avgProt.toFixed(0)}g (recomendado: 100g+ para otimizar síntese proteica).`
          });
        } else {
          insights.push({
            title: '💪 Excelente Sincronia Nutricional',
            desc: `Seu consumo proteico acompanha perfeitamente os dias de alta intensidade de treino, favorecendo a regeneração muscular.`
          });
        }
      }

      // Análise 2: Consistência x Perda de Peso
      const workoutCount = store.executions.length;
      if (workoutCount >= 3) {
        insights.push({
          title: '🔥 Padrão de Progresso Confirmado',
          desc: `Registros confirmam que sua sequência de ${workoutCount} treinos mantidos gerou um ritmo constante de evolução em direção à sua meta de ${store.currentUser.targetWeight}kg.`
        });
      }

      // Análise 3: Balanço Calórico
      const today = new Date().toISOString().split('T')[0];
      const todayMeals = store.meals.filter(m => m.date === today);
      const todayCalories = todayMeals.reduce((acc, m) => acc + m.calories, 0);
      
      if (todayCalories > 0) {
        const diffPercent = ((todayCalories - store.currentUser.calorieGoal) / store.currentUser.calorieGoal) * 100;
        if (Math.abs(diffPercent) <= 10) {
          insights.push({
            title: '🎯 Precisão Calórica Notável',
            desc: `Seu consumo diário está dentro da margem ideal de ±10% da sua meta estipulada (${store.currentUser.calorieGoal} kcal).`
          });
        }
      }

      if (insights.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted);">Continue registrando seus treinos e refeições diariamente para desbloquear diagnósticos automatizados!</p>`;
        return;
      }

      insights.forEach(item => {
        const card = document.createElement('div');
        card.className = 'insight-card';
        card.innerHTML = `
          <div class="insight-title">${item.title}</div>
          <div class="insight-desc">${item.desc}</div>
        `;
        container.appendChild(card);
      });
    }

    /* ==========================================
       RENDERIZADORES DE VIEWS E REPETIÇÕES
       ========================================== */
    function renderPerfil() {
      document.getElementById('profileName').value = store.currentUser.name;
      document.getElementById('profileWeight').value = store.currentUser.weight;
      document.getElementById('profileTargetWeight').value = store.currentUser.targetWeight;
      document.getElementById('profileCalorieGoal').value = store.currentUser.calorieGoal;

      // Badges
      const badgesContainer = document.getElementById('badgesContainer');
      badgesContainer.innerHTML = '';
      let unlockedCount = 0;

      store.badges.forEach(b => {
        if (b.unlocked) unlockedCount++;
        const el = document.createElement('div');
        el.className = `badge-card ${b.unlocked ? 'unlocked' : ''}`;
        const badgeIcon = {
          b1: 'icons/alvo.png',
          b2: 'icons/raio.png',
          b3: 'icons/fogo.png',
          b4: 'icons/coroa.png'
        }[b.id];
        el.innerHTML = `
          <img class="badge-icon" src="${badgeIcon}" alt="${b.name}" loading="lazy">
          <div class="badge-name">${b.name}</div>
          <div class="badge-desc">${b.desc}</div>
        `;
        badgesContainer.appendChild(el);
      });

      document.getElementById('badgesCount').innerText = `${unlockedCount}/${store.badges.length} Desbloqueadas`;

      // Gráfico de Peso
      const labels = store.weightHistory.map(w => w.date);
      const data = store.weightHistory.map(w => w.weight);
      renderLineChart('chartWeight', labels, data, '#ffcc00');
    }

    function renderTreino() {
      // Tabela de Execuções
      const tbody = document.getElementById('tableExecutions');
      tbody.innerHTML = '';

      store.executions.slice().reverse().forEach(e => {
        const tr = document.createElement('tr');
        const detail = e.type === 'forca' ? `${e.weight}kg × ${e.reps}r` : `${e.duration} min`;
        const vgtText = e.type === 'forca' ? `${e.vgt} kg` : `${e.caloriesBurned} kcal`;

        tr.innerHTML = `
          <td>${e.date}</td>
          <td><strong>${e.name}</strong> <br><small style="color:var(--text-muted)">${e.group}</small></td>
          <td>${detail}</td>
          <td><span style="color:var(--accent-primary); font-weight:bold;">${vgtText}</span></td>
        `;
        tbody.appendChild(tr);
      });

      // Cálculo de Tendência VGT
      const forceExecs = store.executions.filter(e => e.type === 'forca');
      const vgtData = forceExecs.map(e => e.vgt);
      const vgtLabels = forceExecs.map(e => e.date);

      renderLineChart('chartVGT', vgtLabels, vgtData, '#ad00ff');

      // Classificação de Desempenho (Evolução / Estagnação / Regressão)
      const badge = document.getElementById('vgtStatusBadge');
      if (vgtData.length >= 2) {
        const last = vgtData[vgtData.length - 1];
        const prev = vgtData[vgtData.length - 2];
        if (last > prev) {
          badge.className = 'badge-status status-evolution';
          badge.innerText = 'Evolução';
        } else if (last === prev) {
          badge.className = 'badge-status status-stagnation';
          badge.innerText = 'Estagnação';
        } else {
          badge.className = 'badge-status status-regression';
          badge.innerText = 'Regressão';
        }
      }
    }

    function renderDieta() {
      const today = new Date().toISOString().split('T')[0];
      const todayMeals = store.meals.filter(m => m.date === today);
      const todayExecs = store.executions.filter(e => e.date === today);

      const consumed = todayMeals.reduce((acc, m) => acc + m.calories, 0);
      const burned = todayExecs.reduce((acc, e) => acc + (e.caloriesBurned || 0), 0);
      const metaBase = store.currentUser.calorieGoal;

      document.getElementById('valConsumido').innerText = `${consumed} kcal`;
      document.getElementById('valGasto').innerText = `${burned} kcal`;
      document.getElementById('valMetaAjustada').innerText = `${metaBase + burned} kcal`;

      renderBarChart('chartCaloricBalance', consumed, burned, metaBase);
    }

    function renderRanking() {
      const rankingList = document.getElementById('rankingList');
      rankingList.innerHTML = '';

      // Compilar lista com Usuário Atual + Mocks
      const allUsers = [
        { ...store.currentUser, me: true, consistencyRate: 94 },
        ...MOCK_USERS
      ].sort((a, b) => b.score - a.score);

      allUsers.forEach((u, idx) => {
        const item = document.createElement('div');
        item.className = `ranking-item ${u.me ? 'me' : ''}`;
        item.innerHTML = `
          <div style="display:flex; align-items:center; gap:0.75rem;">
            <div class="rank-pos">#${idx + 1}</div>
            <div>
              <strong style="font-size:0.95rem;">${u.name} ${u.me ? '(Você)' : ''}</strong>
              <div style="font-size:0.75rem; color:var(--text-muted)">
                Aderência: ${u.consistencyRate}% | Liga: ${u.division}
              </div>
            </div>
          </div>
          <div style="font-weight:800; color:var(--accent-secondary); font-size:1rem;">
            ${u.score} pts
          </div>
        `;
        rankingList.appendChild(item);
      });

      // Comparador de Disciplina
      const compContainer = document.getElementById('comparisonContainer');
      compContainer.innerHTML = `
        <div style="font-size:0.85rem; display:grid; gap:0.5rem;">
          <div style="display:flex; justify-content:space-between; padding:0.4rem; background:var(--bg-dark); border-radius:6px;">
            <span>Sua Aderência Semanal:</span>
            <strong style="color:var(--accent-primary)">94%</strong>
          </div>
          <div style="display:flex; justify-content:space-between; padding:0.4rem; background:var(--bg-dark); border-radius:6px;">
            <span>Média da Liga (${store.currentUser.division}):</span>
            <strong style="color:var(--accent-highlight)">88%</strong>
          </div>
        </div>
      `;

      // Desafio Coletivo
      const totalVGTAll = store.executions.reduce((acc, e) => acc + (e.vgt || 0), 0) + 4350;
      const targetVGT = 10000;
      const pct = Math.min(100, (totalVGTAll / targetVGT) * 100);

      document.getElementById('communityProgressBar').style.width = `${pct}%`;
      document.getElementById('communityProgressTxt').innerText = `${totalVGTAll.toLocaleString()} kg / 10.000 kg`;
    }

    /* ==========================================
       EVENT HANDLERS & NAVEGAÇÃO SPA
       ========================================== */
    function setupNavigation() {
      const tabs = document.querySelectorAll('.nav-tab');
      const updateNavigationIcons = () => {
        document.querySelectorAll('.nav-tab .nav-icon').forEach(icon => {
          const tab = icon.closest('.nav-tab');
          icon.src = tab.classList.contains('active')
            ? icon.dataset.iconActive
            : icon.dataset.iconInactive;
        });
      };

      updateNavigationIcons();

      tabs.forEach(tab => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-target');

          // Atualizar tabs ativas
          tabs.forEach(t => t.classList.remove('active'));
          document.querySelectorAll(`[data-target="${target}"]`).forEach(t => t.classList.add('active'));
          updateNavigationIcons();

          // Alternar Views SPA
          document.querySelectorAll('.view-panel').forEach(panel => {
            panel.classList.remove('active');
          });
          const activePanel = document.getElementById(target);
          if (activePanel) activePanel.classList.add('active');

          // Trigger Renders específicos
          if (target === 'view-perfil') renderPerfil();
          if (target === 'view-treino') renderTreino();
          if (target === 'view-dieta') renderDieta();
          if (target === 'view-insights') generateDynamicInsights();
          if (target === 'view-ranking') renderRanking();
        });
      });
    }

    function setupForms() {
      // Form Perfil
      document.getElementById('formPerfil').addEventListener('submit', (e) => {
        e.preventDefault();
        store.currentUser.name = document.getElementById('profileName').value;
        store.currentUser.weight = parseFloat(document.getElementById('profileWeight').value);
        store.currentUser.targetWeight = parseFloat(document.getElementById('profileTargetWeight').value);
        store.currentUser.calorieGoal = parseInt(document.getElementById('profileCalorieGoal').value);
        
        Database.save(store);
        alert('Perfil atualizado com sucesso!');
        updateGamificationScore();
      });

      // Form Novo Peso
      document.getElementById('formAddWeight').addEventListener('submit', (e) => {
        e.preventDefault();
        const w = parseFloat(document.getElementById('newWeightVal').value);
        const today = new Date().toISOString().split('T')[0];
        
        store.weightHistory.push({ date: today, weight: w });
        store.currentUser.weight = w;
        
        Database.save(store);
        renderPerfil();
        document.getElementById('newWeightVal').value = '';
      });

      // Toggle Tipo Treino (Força x Cardio)
      document.getElementById('execType').addEventListener('change', (e) => {
        const isForca = e.target.value === 'forca';
        document.getElementById('fieldsForca').style.display = isForca ? 'block' : 'none';
        document.getElementById('fieldsCardio').style.display = isForca ? 'none' : 'block';
      });

      // Form Exercício
      document.getElementById('formExecution').addEventListener('submit', (e) => {
        e.preventDefault();
        const type = document.getElementById('execType').value;
        const weight = parseFloat(document.getElementById('execWeight').value) || 0;
        const reps = parseInt(document.getElementById('execReps').value) || 0;
        const sets = parseInt(document.getElementById('execSets').value) || 0;
        
        const vgt = type === 'forca' ? (weight * reps * sets) : 0;

        const newExec = {
          id: 'e_' + Date.now(),
          userId: store.currentUser.id,
          date: document.getElementById('execDate').value,
          type: type,
          name: document.getElementById('execName').value,
          group: document.getElementById('execGroup').value,
          weight: weight,
          reps: reps,
          sets: sets,
          duration: parseInt(document.getElementById('execTime').value) || 0,
          caloriesBurned: parseInt(document.getElementById('execBurned').value) || 0,
          vgt: vgt
        };

        store.executions.push(newExec);
        
        // Verificar Badge Dupla Dinâmica
        const today = newExec.date;
        const hasMealToday = store.meals.some(m => m.date === today);
        if (hasMealToday) {
          const b = store.badges.find(x => x.id === 'b3');
          if (b) b.unlocked = true;
        }

        Database.save(store);
        updateGamificationScore();
        renderTreino();
        alert('Execução de treino salva!');
      });

      // Form Refeição
      document.getElementById('formMeal').addEventListener('submit', (e) => {
        e.preventDefault();
        const newMeal = {
          id: 'm_' + Date.now(),
          userId: store.currentUser.id,
          date: document.getElementById('mealDate').value,
          name: document.getElementById('mealName').value,
          calories: parseInt(document.getElementById('mealCalories').value),
          protein: parseFloat(document.getElementById('mealProtein').value),
          carbs: parseFloat(document.getElementById('mealCarbs').value) || 0,
          fat: parseFloat(document.getElementById('mealFat').value) || 0
        };

        store.meals.push(newMeal);
        Database.save(store);
        updateGamificationScore();
        renderDieta();
        alert('Refeição registrada com sucesso!');
      });
    }

    // Inicialização da Aplicação
    document.addEventListener('DOMContentLoaded', () => {
      // Setar datas padrão nos inputs para hoje
      const today = new Date().toISOString().split('T')[0];
      document.getElementById('execDate').value = today;
      document.getElementById('mealDate').value = today;

      setupNavigation();
      setupForms();
      updateGamificationScore();
      renderPerfil();
    });