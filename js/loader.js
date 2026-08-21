/* Preloader Il Nemico: il logo (pecora nera + scritta, sfondo bianco piatto)
   è sovrapposto in mix-blend-mode:multiply a un div che anima il colore di
   sfondo da rosso scuro a bianco puro. Il nero satura sempre a nero, il
   bianco assume il colore sottostante: quando questo arriva a #fff, il
   composito coincide col logo reale — nessun asset grafico aggiuntivo. */
(function () {
  "use strict";

  var root = document.documentElement;
  root.classList.add("is-loading");

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var preloader = document.getElementById("preloader");
  var colorLayer = document.querySelector(".preloader-color");
  if (!preloader) { root.classList.remove("is-loading"); return; }

  var doneFired = false;
  function fireDone() {
    if (doneFired) return;
    doneFired = true;
    window.dispatchEvent(new Event("nemicoLoaderDone"));
  }

  function finishUp() {
    root.classList.add("loader-done");
    root.classList.remove("is-loading");
    fireDone();
    preloader.classList.add("is-hidden");
    setTimeout(function () {
      if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
    }, 700);
  }

  var hardCap = setTimeout(finishUp, 6000);

  function skip() {
    clearTimeout(hardCap);
    finishUp();
  }
  preloader.addEventListener("click", skip);

  if (reduceMotion) {
    clearTimeout(hardCap);
    if (colorLayer) colorLayer.style.backgroundColor = "#ffffff";
    setTimeout(finishUp, 150);
    return;
  }

  if (colorLayer) {
    colorLayer.style.transition = "background-color 1.7s cubic-bezier(.16,.84,.44,1)";
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        colorLayer.style.backgroundColor = "#ffffff";
      });
    });
  }

  setTimeout(function () {
    clearTimeout(hardCap);
    finishUp();
  }, 2200);
})();
