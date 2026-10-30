/* ================================================================
       CONFIGURAÇÃO — edite aqui para personalizar conteúdo e links
    ================================================================ */
    const CFG = {
      name:     'Yago Amos',
      sections: 4,
    };

    /* ================================================================
       EFEITO DECODE / MATRIX NO NOME
    ================================================================ */
    const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#\$%&!?';
    let decodeInterval = null;

    function randomChar() {
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    }

    function startDecode() {
      const el = document.getElementById('name-text');
      if (!el) return;
      if (decodeInterval) clearInterval(decodeInterval);

      const target = CFG.name.split('');
      const len    = target.length;
      let frame    = 0;
      const totalFrames = len * 7; // velocidade: aumente para mais lento

      // inicia com caracteres aleatórios
      el.textContent = target.map(c => c === ' ' ? ' ' : randomChar()).join('');

      decodeInterval = setInterval(() => {
        const revealed = Math.floor(frame / 7);

        el.textContent = target.map((ch, i) => {
          if (ch === ' ')   return ' ';
          if (i < revealed) return ch;
          return randomChar();
        }).join('');

        frame++;
        if (frame > totalFrames) {
          clearInterval(decodeInterval);
          el.textContent = CFG.name;
        }
      }, 48);
    }

    /* ================================================================
       CUBO 3D — ENGINE PRINCIPAL
    ================================================================ */
    const cube       = document.getElementById('cube');
    const faces      = Array.from(document.querySelectorAll('.face'));
    const dots       = Array.from(document.querySelectorAll('.dot'));
    const N          = CFG.sections;

    let current      = 0;
    let locked       = false;      // bloqueia durante animação
    let halfH        = window.innerHeight / 2;
    let halfH_dvh    = halfH;      // mesmo valor; ajustado em resize

    /* ------------------------------------------------------------------
       Calcula e aplica a posição 3D de cada face
       O cubo tem faces a cada 90°. Para um cubo de N faces:
         face i: rotateX(-i * 90°) translateZ(halfH)
       O cubo em si é rotacionado por: rotateX(current * 90°) translateZ(halfH)
    ------------------------------------------------------------------ */
    function setFaceTransforms() {
      halfH = window.innerHeight / 2;
      faces.forEach((face, i) => {
        const angle = -i * 90;
        face.style.transform =
          'rotateX(' + angle + 'deg) translateZ(' + halfH + 'px)';
      });
    }

    /* Posição do cubo de acordo com a seção atual (sem animação) */
    function setCubeInstant(index) {
      cube.style.transition = 'none';
      cube.style.transform  =
        'translateZ(' + (-halfH) + 'px) rotateX(' + (index * 90) + 'deg)';
    }

    /* Posição do cubo COM animação */
    function setCubeAnimated(index) {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const dur = reducedMotion ? '1ms' : (getComputedStyle(document.documentElement)
        .getPropertyValue('--duration').trim() || '900ms');
      cube.style.transition =
        'transform ' + dur + ' cubic-bezier(0.77, 0, 0.175, 1)';
      cube.style.transform =
        'translateZ(' + (-halfH) + 'px) rotateX(' + (index * 90) + 'deg)';
    }

    /* ----------------------------------------------------------------
       Navegar para uma seção específica
    ---------------------------------------------------------------- */
    function goTo(next) {
      if (locked)          return;
      if (next < 0)        return;
      if (next >= N)       return;
      if (next === current) return;

      locked = true;

      // Reseta scroll interno da face atual (ex.: projetos)
      faces[current].scrollTop = 0;

      current = next;

      // Atualiza bolinhas
      dots.forEach((d, i) => d.classList.toggle('active', i === current));

      // Anima cubo
      setCubeAnimated(current);

      // Dispara animações de entrada após pequeno delay
      const enterDelay = 350;
      setTimeout(() => triggerAnims(current), enterDelay);

      // Reinicia decode se for face 0
      if (current === 0) setTimeout(startDecode, enterDelay);

      // Libera lock após a transição
      const durMs = 900 + 120; // --duration + margem
      setTimeout(() => { locked = false; }, durMs);
    }

    /* ----------------------------------------------------------------
       Animações de entrada (fadeUp escalonado)
    ---------------------------------------------------------------- */
    function triggerAnims(index) {
      const sec   = faces[index];
      const items = sec.querySelectorAll('.anim');

      // Resetar (remove classe para poder re-animar)
      items.forEach(el => {
        el.classList.remove('play');
        // força reflow
        void el.offsetWidth;
      });

      // Aplica delay com requestAnimationFrame para garantir que
      // o browser processou o reflow antes de iniciar a animação
      requestAnimationFrame(() => {
        items.forEach(el => el.classList.add('play'));
      });
    }

    /* ================================================================
       CONTROLES DE ENTRADA
    ================================================================ */

    /* --- Wheel (scroll do mouse) --- */
    let wheelBuf = 0;
    let wheelTimer = null;

    window.addEventListener('wheel', function(e) {
      if (locked) {
        e.preventDefault();
        return;
      }

      // Permite rolar o conteúdo de uma seção quando ele ultrapassa a tela.
      const activeFace = faces[current];
      const canScroll = activeFace.scrollHeight > activeFace.clientHeight + 2;
      const atTop = activeFace.scrollTop <= 0;
      const atBottom = activeFace.scrollTop + activeFace.clientHeight >= activeFace.scrollHeight - 2;
      const scrollingInside = canScroll && (
        (e.deltaY > 0 && !atBottom) || (e.deltaY < 0 && !atTop)
      );

      if (scrollingInside) return;

      e.preventDefault();
      wheelBuf += e.deltaY;

      clearTimeout(wheelTimer);
      wheelTimer = setTimeout(function() {
        if (Math.abs(wheelBuf) > 20) {
          goTo(wheelBuf > 0 ? current + 1 : current - 1);
        }
        wheelBuf = 0;
      }, 60);
    }, { passive: false });

    /* --- Teclado --- */
    window.addEventListener('keydown', function(e) {
      const tag = e.target && e.target.tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(tag)) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goTo(current + 1);
      }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goTo(current - 1);
      }
      if (e.key === 'Home') goTo(0);
      if (e.key === 'End') goTo(N - 1);
    });

    /* --- Touch / Swipe --- */
    let touchY0 = 0;
    let touchY1 = 0;

    window.addEventListener('touchstart', function(e) {
      touchY0 = e.touches[0].clientY;
      touchY1 = touchY0;
    }, { passive: true });

    window.addEventListener('touchmove', function(e) {
      touchY1 = e.touches[0].clientY;
    }, { passive: true });

    window.addEventListener('touchend', function() {
      if (locked) return;
      const diff = touchY0 - touchY1;
      if (Math.abs(diff) > 45) {
        goTo(diff > 0 ? current + 1 : current - 1);
      }
    });

    /* --- Bolinhas --- */
    dots.forEach(function(dot) {
      dot.addEventListener('click', function() {
        goTo(parseInt(dot.dataset.to, 10));
      });
    });

    /* --- Resize --- */
    window.addEventListener('resize', function() {
      setFaceTransforms();
      setCubeInstant(current);
    });

    /* ================================================================
       INICIALIZAÇÃO
    ================================================================ */
    (function init() {
      setFaceTransforms();
      setCubeInstant(0);

      // Primeira animação de entrada + decode
      setTimeout(function() {
        triggerAnims(0);
        startDecode();
      }, 150);
    })();
