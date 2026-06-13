document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================================================
    // 1. INICIALIZACIÓN Y TRANSICIÓN DE ENTRADA
    // ==========================================================================
    const pantallaInicio = document.getElementById('pantalla-inicio');
    const escena3D = document.querySelector('.escena-3d');
    const audioFondo = document.getElementById('audio-fondo');
    const btnMusica = document.getElementById('btn-musica');
    
    let musicaSonando = false;

    pantallaInicio.addEventListener('click', () => {
        // Efecto Zoom out y desvanecimiento
        pantallaInicio.style.transform = 'scale(1.5)';
        pantallaInicio.style.opacity = '0';
        
        // Intentar reproducir música automáticamente (las políticas del navegador lo requieren tras interacción)
        if (audioFondo.src && audioFondo.src !== window.location.href) {
            audioFondo.volume = 0.5;
            audioFondo.play().then(() => {
                musicaSonando = true;
            }).catch(e => console.log("Añade un archivo musica.mp3 para el audio"));
        }

        setTimeout(() => {
            pantallaInicio.remove();
            escena3D.classList.add('activa');
            iniciarScrollReveal();
            iniciarMotorGrafico();
        }, 1200);
    });

    // Control de música
    btnMusica.addEventListener('click', () => {
        if (musicaSonando) {
            audioFondo.pause();
            btnMusica.classList.add('pausado');
        } else {
            audioFondo.play();
            btnMusica.classList.remove('pausado');
        }
        musicaSonando = !musicaSonando;
    });

    // ==========================================================================
    // 2. SCROLL REVEAL AVANZADO (Intersection Observer)
    // ==========================================================================
    function iniciarScrollReveal() {
        const opciones = { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.1 };
        const observer = new IntersectionObserver((entradas) => {
            entradas.forEach((entrada) => {
                if (entrada.isIntersecting) {
                    entrada.target.classList.add('visible');
                    observer.unobserve(entrada.target);
                }
            });
        }, opciones);

        document.querySelectorAll('.reveal').forEach((el, index) => {
            // Añadir delay escalonado dinámico para elementos muy juntos
            el.style.transitionDelay = `${index % 3 * 0.15}s`;
            observer.observe(el);
        });
    }

    // ==========================================================================
    // 3. FÍSICA 3D DE LA CARTA (INTERPOLACIÓN LINEAL / LERP)
    // ==========================================================================
    const carta = document.getElementById('carta');
    let ratonX = 0, ratonY = 0;
    let objetivoRotX = 0, objetivoRotY = 0;
    let actualRotX = 0, actualRotY = 0;
    
    // Constante de suavizado (menor = más suave)
    const LERP_FACTOR = 0.08; 

    // Solo activamos 3D si es un dispositivo con ratón (evita fallos en móvil)
    if (window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener('mousemove', (e) => {
            ratonX = e.clientX;
            ratonY = e.clientY;
            
            // Calcular centro de la carta
            const rect = carta.getBoundingClientRect();
            const centroX = rect.left + rect.width / 2;
            const centroY = rect.top + rect.height / 2;

            // Calcular distancia del ratón al centro (-1 a 1)
            const porcentajeX = (ratonX - centroX) / (rect.width / 2);
            const porcentajeY = (ratonY - centroY) / (rect.height / 2);

            // Grados máximos de rotación
            const maxRot = 12; 
            objetivoRotY = porcentajeX * maxRot;
            objetivoRotX = -porcentajeY * maxRot; // Invertido para rotación natural

            // Iluminación Glare
            const glareX = ((ratonX - rect.left) / rect.width) * 100;
            const glareY = ((ratonY - rect.top) / rect.height) * 100;
            carta.style.setProperty('--glare-x', `${glareX}%`);
            carta.style.setProperty('--glare-y', `${glareY}%`);
            carta.style.setProperty('--glare-opacity', '1');
        });

        carta.addEventListener('mouseleave', () => {
            objetivoRotX = 0;
            objetivoRotY = 0;
            carta.style.setProperty('--glare-opacity', '0');
        });

        // Bucle de animación 3D independiente para máxima fluidez
        function animar3D() {
            // Fórmular Lerp: actual = actual + (objetivo - actual) * factor
            actualRotX += (objetivoRotX - actualRotX) * LERP_FACTOR;
            actualRotY += (objetivoRotY - actualRotY) * LERP_FACTOR;

            carta.style.setProperty('--rotate-x', `${actualRotX}deg`);
            carta.style.setProperty('--rotate-y', `${actualRotY}deg`);

            requestAnimationFrame(animar3D);
        }
        animar3D();
    }

    // ==========================================================================
    // 4. MOTOR GRÁFICO (PARTÍCULAS, CONSTELACIONES Y ESTELAS)
    // ==========================================================================
    function iniciarMotorGrafico() {
        const canvas = document.getElementById('universo-canvas');
        const ctx = canvas.getContext('2d');
        
        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;
        
        window.addEventListener('resize', () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        });

        const particulas = [];
        const maxParticulas = window.innerWidth < 768 ? 40 : 80;

        // Clase Partícula Avanzada
        class Estrella {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.radio = Math.random() * 1.5 + 0.5;
                this.vx = (Math.random() - 0.5) * 0.5;
                this.vy = (Math.random() - 0.5) * 0.5;
                // Fase para el parpadeo
                this.fase = Math.random() * Math.PI * 2;
                this.velocidadParpadeo = 0.01 + Math.random() * 0.02;
            }

            dibujar() {
                // Opacidad basada en el seno (parpadeo suave)
                const alpha = Math.abs(Math.sin(this.fase)) * 0.7 + 0.3;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radio, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                ctx.shadowBlur = 10;
                ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
                ctx.fill();
                ctx.shadowBlur = 0; // Limpiar para rendimiento
            }

            actualizar() {
                this.x += this.vx;
                this.y += this.vy;
                this.fase += this.velocidadParpadeo;

                // Rebotar contra bordes
                if (this.x < 0 || this.x > width) this.vx *= -1;
                if (this.y < 0 || this.y > height) this.vy *= -1;

                // Repulsión suave del ratón
                let dx = ratonX - this.x;
                let dy = ratonY - this.y;
                let distancia = Math.sqrt(dx * dx + dy * dy);
                if (distancia < 100) {
                    this.x -= (dx / distancia) * 1.5;
                    this.y -= (dy / distancia) * 1.5;
                }
            }
        }

        // Crear array de partículas
        for (let i = 0; i < maxParticulas; i++) {
            particulas.push(new Estrella());
        }

        // Rastro de estela dorada interactiva
        const estelas = [];
        class EstelaMagica {
            constructor(x, y) {
                this.x = x + (Math.random() - 0.5) * 20;
                this.y = y + (Math.random() - 0.5) * 20;
                this.size = Math.random() * 2 + 1;
                this.vx = (Math.random() - 0.5) * 1.5;
                this.vy = (Math.random() - 0.5) * 1.5 - 1; // Sube lentamente
                this.life = 1;
                this.color = Math.random() > 0.5 ? '255, 215, 0' : '255, 154, 158';
            }
            dibujar() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
                ctx.fill();
            }
            actualizar() {
                this.x += this.vx;
                this.y += this.vy;
                this.life -= 0.02; // Se desvanece
                this.size *= 0.96; // Se encoje
            }
        }

        window.addEventListener('mousemove', (e) => {
            if(Math.random() > 0.5) { // No crear demasiadas para mantener rendimiento
                estelas.push(new EstelaMagica(e.clientX, e.clientY));
            }
        });

        // Bucle Principal de Renderizado
        function render() {
            // Fondo semitransparente para efecto Motion Blur
            ctx.fillStyle = 'rgba(3, 5, 10, 0.2)';
            ctx.fillRect(0, 0, width, height);

            // 1. Conectar partículas cercanas (Constelaciones)
            for (let i = 0; i < particulas.length; i++) {
                for (let j = i + 1; j < particulas.length; j++) {
                    let dx = particulas[i].x - particulas[j].x;
                    let dy = particulas[i].y - particulas[j].y;
                    let dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(255, 215, 0, ${0.15 - dist/800})`; // Más tenue cuanto más lejos
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particulas[i].x, particulas[i].y);
                        ctx.lineTo(particulas[j].x, particulas[j].y);
                        ctx.stroke();
                    }
                }
            }

            // 2. Actualizar y dibujar partículas
            particulas.forEach(p => {
                p.actualizar();
                p.dibujar();
            });

            // 3. Actualizar y dibujar estela
            for (let i = 0; i < estelas.length; i++) {
                estelas[i].actualizar();
                estelas[i].dibujar();
                if (estelas[i].life <= 0) {
                    estelas.splice(i, 1);
                    i--;
                }
            }

            requestAnimationFrame(render);
        }
        render();
    }
});