/* ═══════════════════════════════════════
   BLADE · BARBERÍA URBANA · JS
   ═══════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', function () {

    // ─── CONFIG (CAMBIAR DATOS REALES ACÁ) ───
    var CONFIG = {
        whatsapp: '5491167890123',
        email: 'blade.barberia@gmail.com',
        nombreNegocio: 'BLADE Barbería',
        diasCerrado: [0, 1],          // 0=Dom, 1=Lun
        horarioInicio: 9,
        horarioFin: 20,
        intervaloMinutos: 30,
        turnosOcupados: {}
    };

    var meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
    var diasSemana = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];

    // ─── NAV ───
    var nav = document.getElementById('nav');
    window.addEventListener('scroll', function () {
        nav.classList.toggle('scrolled', window.scrollY > 50);
    });

    // ─── MENÚ MÓVIL ───
    var burger = document.getElementById('burger');
    var navMenu = document.getElementById('navMenu');

    burger.addEventListener('click', function () {
        burger.classList.toggle('active');
        navMenu.classList.toggle('open');
        document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });

    navMenu.querySelectorAll('a').forEach(function (l) {
        l.addEventListener('click', function () {
            burger.classList.remove('active');
            navMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // ─── SCROLL REVEAL ───
    var reveals = document.querySelectorAll('.reveal,.reveal-left,.reveal-right');
    var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) {
                var p = e.target.parentElement;
                var h = p.querySelectorAll('.reveal,.reveal-left,.reveal-right');
                var i = Array.from(h).indexOf(e.target);
                setTimeout(function () { e.target.classList.add('visible'); }, i * 80);
                obs.unobserve(e.target);
            }
        });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    reveals.forEach(function (el) { obs.observe(el); });

    // ─── CONTADOR ───
    var counter1 = document.getElementById('counter1');
    var target = 4800;
    var counted = false;
    var cObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting && !counted) {
                counted = true;
                var cur = 0, inc = target / 80;
                function up() {
                    cur += inc;
                    if (cur >= target) counter1.textContent = target.toLocaleString() + '+';
                    else { counter1.textContent = Math.floor(cur).toLocaleString(); requestAnimationFrame(up); }
                }
                up();
            }
        });
    }, { threshold: 0.5 });
    cObs.observe(counter1);

    // ─── LIGHTBOX ───
    var lb = document.getElementById('lightbox');
    var lbImg = document.getElementById('lbImg');
    var galItems = document.querySelectorAll('.gal-item');
    var ci = 0;

    function openLb(i) { ci = i; lbImg.src = galItems[i].querySelector('img').src; lb.classList.add('active'); document.body.style.overflow = 'hidden'; }
    function closeLb() { lb.classList.remove('active'); document.body.style.overflow = ''; }
    function prevI() { ci = (ci - 1 + galItems.length) % galItems.length; lbImg.src = galItems[ci].querySelector('img').src; lbImg.style.animation = 'none'; lbImg.offsetHeight; lbImg.style.animation = 'lbIn 0.3s ease'; }
    function nextI() { ci = (ci + 1) % galItems.length; lbImg.src = galItems[ci].querySelector('img').src; lbImg.style.animation = 'none'; lbImg.offsetHeight; lbImg.style.animation = 'lbIn 0.3s ease'; }

    galItems.forEach(function (item, i) { item.addEventListener('click', function () { openLb(i); }); });
    document.getElementById('lbClose').addEventListener('click', closeLb);
    document.getElementById('lbPrev').addEventListener('click', prevI);
    document.getElementById('lbNext').addEventListener('click', nextI);
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function (e) {
        if (!lb.classList.contains('active')) return;
        if (e.key === 'Escape') closeLb();
        if (e.key === 'ArrowLeft') prevI();
        if (e.key === 'ArrowRight') nextI();
    });

    var tx = 0;
    lb.addEventListener('touchstart', function (e) { tx = e.changedTouches[0].screenX; }, { passive: true });
    lb.addEventListener('touchend', function (e) { var d = tx - e.changedTouches[0].screenX; if (Math.abs(d) > 50) { d > 0 ? nextI() : prevI(); } }, { passive: true });

    // ─── SMOOTH SCROLL ───
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
        a.addEventListener('click', function (e) {
            e.preventDefault();
            var id = this.getAttribute('href');
            if (id === '#') return;
            var dest = document.querySelector(id);
            if (dest) window.scrollTo({ top: dest.offsetTop - 70, behavior: 'smooth' });
        });
    });

    // ═══════════════════════════════════
    // SISTEMA DE TURNOS - 3 PASOS
    // ═══════════════════════════════════

    var currentStep = 1;
    var selectedDate = null;
    var selectedHour = null;
    var calendarDate = new Date();

    // ─── PASOS ───
    document.querySelectorAll('.step-next').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var next = parseInt(this.dataset.next);
            if (!validarPaso(currentStep)) return;
            if (next === 3) generarResumen();
            goToStep(next);
        });
    });

    document.querySelectorAll('.step-prev').forEach(function (btn) {
        btn.addEventListener('click', function () {
            goToStep(parseInt(this.dataset.prev));
        });
    });

    function goToStep(step) {
        document.querySelectorAll('.form-step').forEach(function (s) { s.classList.remove('active'); });
        document.getElementById('step' + step).classList.add('active');

        document.querySelectorAll('.progress-step').forEach(function (ps) {
            var s = parseInt(ps.dataset.step);
            ps.classList.remove('active', 'done');
            if (s === step) ps.classList.add('active');
            else if (s < step) ps.classList.add('done');
        });

        var lines = document.querySelectorAll('.progress-fill');
        lines.forEach(function (line, i) {
            line.style.width = (i < step - 1) ? '100%' : '0';
        });

        currentStep = step;
    }

    function validarPaso(step) {
        var el = document.getElementById('step' + step);
        var campos = el.querySelectorAll('input[required],select[required]');
        var ok = true;

        campos.forEach(function (c) {
            c.classList.remove('error');
            if (!c.value.trim()) {
                c.classList.add('error');
                ok = false;
                setTimeout(function () { c.classList.remove('error'); }, 3000);
            }
        });

        if (step === 2) {
            if (!selectedDate) { alert('Selecciona una fecha'); ok = false; }
            if (!selectedHour) { alert('Selecciona un horario'); ok = false; }
        }

        return ok;
    }

    // ─── CALENDARIO ───
    function renderCal() {
        var year = calendarDate.getFullYear();
        var month = calendarDate.getMonth();
        var hoy = new Date(); hoy.setHours(0, 0, 0, 0);

        document.getElementById('calMes').textContent = meses[month] + ' ' + year;

        var primer = new Date(year, month, 1);
        var ultimo = new Date(year, month + 1, 0);
        var start = primer.getDay();
        start = start === 0 ? 6 : start - 1;

        var cont = document.getElementById('calDias');
        cont.innerHTML = '';

        for (var i = 0; i < start; i++) {
            var empty = document.createElement('div');
            empty.className = 'cal-dia empty';
            cont.appendChild(empty);
        }

        for (var d = 1; d <= ultimo.getDate(); d++) {
            var fecha = new Date(year, month, d);
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'cal-dia';
            btn.textContent = d;

            var dow = fecha.getDay();
            var pasado = fecha < hoy;
            var cerrado = CONFIG.diasCerrado.indexOf(dow) !== -1;

            if (pasado || cerrado) {
                btn.classList.add('disabled');
            } else {
                if (fecha.getTime() === hoy.getTime()) btn.classList.add('today');
                if (selectedDate) {
                    var sel = new Date(selectedDate);
                    if (fecha.getTime() === sel.getTime()) btn.classList.add('selected');
                }

                btn.addEventListener('click', (function (f) {
                    return function () {
                        selectedDate = f.toISOString().split('T')[0];
                        selectedHour = null;
                        document.getElementById('turnoFecha').value = selectedDate;
                        document.getElementById('turnoHora').value = '';
                        document.getElementById('btnToStep3').disabled = true;
                        renderCal();
                        mostrarHorarios();
                    };
                })(fecha));
            }

            cont.appendChild(btn);
        }
    }

    document.getElementById('calPrev').addEventListener('click', function () {
        calendarDate.setMonth(calendarDate.getMonth() - 1);
        var hoy = new Date();
        if (calendarDate.getFullYear() < hoy.getFullYear() ||
            (calendarDate.getFullYear() === hoy.getFullYear() && calendarDate.getMonth() < hoy.getMonth())) {
            calendarDate = new Date();
        }
        renderCal();
    });

    document.getElementById('calNext').addEventListener('click', function () {
        calendarDate.setMonth(calendarDate.getMonth() + 1);
        renderCal();
    });

    renderCal();

    // ─── HORARIOS ───
    function mostrarHorarios() {
        var wrap = document.getElementById('horariosWrap');
        var grid = document.getElementById('horariosGrid');
        grid.innerHTML = '';
        wrap.style.display = 'block';

        var ocupados = CONFIG.turnosOcupados[selectedDate] || [];

        for (var h = CONFIG.horarioInicio; h < CONFIG.horarioFin; h++) {
            for (var m = 0; m < 60; m += CONFIG.intervaloMinutos) {
                var hora = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'hora-btn';
                btn.textContent = hora;

                var ahora = new Date();
                var fechaSel = new Date(selectedDate + 'T' + hora + ':00');
                var pasada = fechaSel < ahora;
                var ocupado = ocupados.indexOf(hora) !== -1;

                if (pasada || ocupado) {
                    btn.classList.add('disabled');
                } else {
                    if (selectedHour === hora) btn.classList.add('selected');

                    btn.addEventListener('click', (function (hr) {
                        return function () {
                            selectedHour = hr;
                            document.getElementById('turnoHora').value = hr;
                            document.getElementById('btnToStep3').disabled = false;
                            grid.querySelectorAll('.hora-btn').forEach(function (b) { b.classList.remove('selected'); });
                            this.classList.add('selected');
                        };
                    })(hora));
                }

                grid.appendChild(btn);
            }
        }
    }

    // ─── RESUMEN ───
    function generarResumen() {
        var nombre = document.getElementById('turnoNombre').value;
        var tel = document.getElementById('turnoTel').value;
        var servicio = document.getElementById('turnoServicio').value;

        var fObj = new Date(selectedDate + 'T12:00:00');
        var fechaF = diasSemana[fObj.getDay()] + ' ' + fObj.getDate() + ' de ' + meses[fObj.getMonth()];

        document.getElementById('resumen').innerHTML =
            '<div class="resumen-item"><span class="resumen-label">Nombre</span><span class="resumen-valor">' + nombre + '</span></div>' +
            '<div class="resumen-item"><span class="resumen-label">WhatsApp</span><span class="resumen-valor">' + tel + '</span></div>' +
            '<div class="resumen-item"><span class="resumen-label">Servicio</span><span class="resumen-valor">' + servicio + '</span></div>' +
            '<div class="resumen-item"><span class="resumen-label">Fecha</span><span class="resumen-valor">' + fechaF + '</span></div>' +
            '<div class="resumen-item"><span class="resumen-label">Hora</span><span class="resumen-valor">' + selectedHour + ' hs</span></div>';
    }

    // ─── ENVIAR ───
    var form = document.getElementById('formTurnos');

    form.addEventListener('submit', function (e) {
        e.preventDefault();

        var btnT = form.querySelector('.btn-texto');
        var btnL = form.querySelector('.btn-loading');
        btnT.style.display = 'none';
        btnL.style.display = 'inline';

        var nombre = document.getElementById('turnoNombre').value;
        var tel = document.getElementById('turnoTel').value;
        var servicio = document.getElementById('turnoServicio').value;

        var fObj = new Date(selectedDate + 'T12:00:00');
        var fechaF = diasSemana[fObj.getDay()] + ' ' + fObj.getDate() + ' de ' + meses[fObj.getMonth()];

        // WhatsApp
        var msg = '🔔 *NUEVO TURNO - ' + CONFIG.nombreNegocio + '*\n\n' +
            '👤 *Nombre:* ' + nombre + '\n' +
            '📱 *WhatsApp:* ' + tel + '\n' +
            '✂️ *Servicio:* ' + servicio + '\n' +
            '📅 *Fecha:* ' + fechaF + '\n' +
            '🕐 *Hora:* ' + selectedHour + ' hs\n\n' +
            '─────────────────\n' +
            'Enviado desde la web';

        var waURL = 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(msg);

        // Email (opcional)
        var asunto = 'Nuevo turno - ' + nombre + ' - ' + fechaF + ' ' + selectedHour;
        var body = 'NUEVO TURNO\n\nNombre: ' + nombre + '\nWhatsApp: ' + tel + '\nServicio: ' + servicio + '\nFecha: ' + fechaF + '\nHora: ' + selectedHour + ' hs';
        var mailURL = 'mailto:' + CONFIG.email + '?subject=' + encodeURIComponent(asunto) + '&body=' + encodeURIComponent(body);

        setTimeout(function () {
            btnT.textContent = '✓ Turno enviado';
            btnT.style.display = 'inline';
            btnL.style.display = 'none';

            var boton = form.querySelector('[type="submit"]');
            boton.style.background = '#4CAF50';

            // Abrir WhatsApp
            window.open(waURL, '_blank');

            // Descomentar para también enviar por mail:
            // window.location.href = mailURL;

            setTimeout(function () {
                form.reset();
                selectedDate = null;
                selectedHour = null;
                btnT.textContent = 'Confirmar turno';
                boton.style.background = '';
                goToStep(1);
                renderCal();
                document.getElementById('horariosWrap').style.display = 'none';
                document.getElementById('btnToStep3').disabled = true;
            }, 4000);
        }, 1500);
    });

});