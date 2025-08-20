// TOOLKING – Custom JS (Popups, Besucherzähler, Scanner, 30-Tage-Preis-Entfernung)

document.addEventListener("DOMContentLoaded", function() {
  const isMobile = /Mobi|Android/i.test(navigator.userAgent) || window.innerWidth < 1024;

  /* =========================================================
     DESKTOP: Fake-Popups + Besucherzähler
  ========================================================= */
  if (!isMobile) {
    try {
      function zufall(arr){ return arr[Math.floor(Math.random()*arr.length)]; }
      function getRandom(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
      function getNewValue(prev){
        const d=prev*0.03, min=Math.max(10,Math.floor(prev-d)), max=Math.min(100,Math.ceil(prev+d));
        return getRandom(min,max);
      }

      const maennerNamen=["Franz","Heinz","Erwin","Thomas","Michael","Markus"];
      const frauenNamen=["Anna","Maria","Sabine","Petra","Claudia","Julia"];
      const institutionen=["eine Firma","ein Unternehmen"];
      const staedte=["Berlin","Hamburg","München","Köln","Frankfurt","Wien","Graz","Linz"];

      function generiereNachricht(){
        const r=Math.random();
        if(r<0.6) return `${zufall(maennerNamen)} aus ${zufall(staedte)} hat gerade bei TOOLKING bestellt`;
        if(r<0.8) return `${zufall(frauenNamen)} aus ${zufall(staedte)} hat gerade bei TOOLKING bestellt`;
        return `${zufall(institutionen)} aus ${zufall(staedte)} hat gerade bei TOOLKING bestellt`;
      }

      function zeigePopup(text){
        const popup=document.createElement("div");
        popup.innerHTML=`<div style="text-align:center;">${text}</div>`;
        Object.assign(popup.style,{
          position:"fixed",top:"20px",left:"50%",transform:"translateX(-50%)",
          background:"#222",color:"#fff",padding:"12px 20px",borderRadius:"8px",
          boxShadow:"0 2px 10px rgba(0,0,0,0.3)",fontSize:"12px",zIndex:"9999",
          opacity:"0",transition:"opacity .5s ease",maxWidth:"400px"
        });
        document.body.appendChild(popup);
        requestAnimationFrame(()=>popup.style.opacity="1");
        setTimeout(()=>{ popup.style.opacity="0"; setTimeout(()=>popup.remove(),1000); },6000);
      }

      // Erstes Popup nach 5s, dann alle 2 Minuten
      setTimeout(() => zeigePopup(generiereNachricht()), 5000);
      setInterval(() => zeigePopup(generiereNachricht()), 120000);

      // Besucherzähler
      let savedValue=localStorage.getItem("toolkingVisitorCount");
      let currentValue=savedValue? getNewValue(parseInt(savedValue,10)) : getRandom(10,100);
      localStorage.setItem("toolkingVisitorCount", currentValue);

      const visitorDiv=document.createElement("div");
      visitorDiv.textContent=`Derzeit ${currentValue} Besucher auf TOOLKING`;
      Object.assign(visitorDiv.style,{
        position:"fixed",bottom:"20px",left:"20px",backgroundColor:"black",color:"white",
        padding:"8px 12px",borderRadius:"8px",fontSize:"12px",
        fontFamily:"Arial, sans-serif",boxShadow:"0 0 5px rgba(0,0,0,0.3)",zIndex:"9999"
      });
      document.body.appendChild(visitorDiv);

      setInterval(()=>{
        currentValue=getNewValue(currentValue);
        visitorDiv.textContent=`Derzeit ${currentValue} Besucher auf TOOLKING`;
        localStorage.setItem("toolkingVisitorCount", currentValue);
      },60000);
    } catch(e){ console.error("Desktop Fehler:", e); }
  }

  /* =========================================================
     MOBIL: EAN-Scanner (QuaggaJS benötigt)
  ========================================================= */
  if (isMobile) {
    try {
      const scannerBtn = document.createElement("img");
      scannerBtn.src = "https://i.ibb.co/TqdP5SYm/ean-logo.png";
      Object.assign(scannerBtn.style,{
        width:"55px",height:"55px",
        position:"fixed",bottom:"20px",left:"20px",
        cursor:"pointer",zIndex:"9999"
      });
      document.body.appendChild(scannerBtn);

      const camBox = document.createElement("div");
      Object.assign(camBox.style,{
        position:"fixed",bottom:"100px",left:"20px",
        width:"240px",height:"180px",
        background:"#000",zIndex:"9999",
        border:"2px solid white",borderRadius:"8px",
        overflow:"hidden",display:"none"
      });
      camBox.innerHTML = `<video id="ean-video" autoplay playsinline style="width:100%; height:100%; object-fit:cover;"></video>`;
      document.body.appendChild(camBox);

      let streamActive = null, lastCodes=[];

      scannerBtn.addEventListener("click", () => {
        camBox.style.display="block";
        navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } })
          .then(stream => {
            streamActive = stream;
            const video = document.getElementById("ean-video");
            video.srcObject = stream;

            Quagga.init({
              inputStream: { type: "LiveStream", target: video },
              decoder: { readers: ["ean_reader","ean_8_reader","code_128_reader"] },
              locate: true, numOfWorkers: 0
            }, function(err) {
              if (err) { console.error("Quagga Init Error:", err); return; }
              Quagga.start();
            });
          })
          .catch(err => console.error("Kamera Fehler:", err));
      });

      Quagga.onDetected(function(data){
        const code = data.codeResult.code;
        lastCodes.push(code);
        if (lastCodes.length > 5) lastCodes.shift();

        const stable = lastCodes.filter(c => c === code).length >= 3;
        if (stable) {
          Quagga.stop();
          camBox.style.display="none";
          if (streamActive) {
            streamActive.getTracks().forEach(track => track.stop());
            streamActive = null;
          }
          // Weiterleitung in die Produktsuche
          window.location.href = `/products/search?keyword=${encodeURIComponent(code)}`;
        }
      });
    } catch(e){ console.error("Mobil Fehler:", e); }
  }

  /* =========================================================
     "Niedrigster Preis in 30 Tagen" entfernen
  ========================================================= */
  function removeLowestPrice() {
    document.querySelectorAll(".ec-text-muted.ec-text-initial-size").forEach(el => {
      if (el.textContent.includes("Niedrigster Preis")) {
        el.remove();
      }
    });
  }
  removeLowestPrice();
  document.addEventListener("ecwid:onPageLoaded", removeLowestPrice);
  setInterval(removeLowestPrice, 2000);

});
