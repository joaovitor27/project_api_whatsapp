const socket = io("http://3.92.199.163");

var element = document.getElementById('idInput');
var maskOptions = {
    mask: '+00 (00) 00000-0000'
};
var mask = IMask(element, maskOptions);

function onlynumber(evt) {
    var theEvent = evt || window.event;
    var key = theEvent.keyCode || theEvent.which;
    key = String.fromCharCode( key );
    //var regex = /^[0-9.,]+$/;
    var regex = /^[0-9.]+$/;
    if( !regex.test(key) ) {
       theEvent.returnValue = false;
       if(theEvent.preventDefault) theEvent.preventDefault();
    }
 }

if ((localStorage.getItem('session') == null) && (localStorage.getItem("statusBot") == null)){
    document.getElementById('activatedBot').style.display = 'none';
    document.getElementById('formulario').style.display = 'block';
} else {
    document.getElementById('formulario').style.display = 'none';
    document.getElementById('activatedBot').style.display = 'block';
}
function criarSessao() {
    socket.emit("create-session", { id: mask.unmaskedValue });
    document.getElementById("carregando").style.display = 'block'
    localStorage.setItem('session', mask.unmaskedValue );
}
socket.on("attempts", (data) => {
    socket.emit("chamarqr", mask.unmaskedValue)
});

socket.on('qrcode', (data) => {
    document.getElementById("textID").style.display = "block";
    document.getElementById("textID").innerHTML = "<b>Id da instancia: </b>" + document.getElementById('idInput').value;
    document.getElementById("carregando").style.display = 'none'
    document.getElementById("img1").src = data
    socket.emit('qrcode')
});

socket.on('message', (data) => {
    document.querySelector("h3").innerHTML = data
    socket.emit("message")
    document.getElementById("img1").remove();
    document.getElementById('formulario').style.display = 'none';
    document.getElementById('activatedBot').style.display = 'block';
    localStorage.setItem('statusBot', 'true');
    location.reload();
})

if(localStorage.getItem("statusBot") == "false"){
    document.getElementById("activated").innerHTML = "Ligar"
    document.getElementById("statusBot").innerHTML = "O bot está: Desligado"
}else{
    document.getElementById("activated").innerHTML = "Desligar"
    document.getElementById("statusBot").innerHTML = "O bot está: Ligado"
}

socket.emit("startSession", localStorage.getItem("session"))

socket.emit("status", localStorage.getItem("session"))
socket.on("status", (data) => {
    if (data == 'CONNECTED'){
        document.getElementById('activatedBot').style.display = 'none';
        document.getElementById('formulario').style.display = 'block';
    }else{
        document.getElementById('activatedBot').style.display = 'none';
        document.getElementById('formulario').style.display = 'block';
    }
})

socket.on('statusBot', (data) => {
    if(data=='true'){
        localStorage.setItem('statusBot', 'true');
        document.getElementById("activated").innerHTML = "Desligar"
        document.getElementById("statusBot").innerHTML = "O bot está: Ligado"
    }else{
        localStorage.setItem('statusBot', 'false');
        document.getElementById("activated").innerHTML = "Ligar"
        document.getElementById("statusBot").innerHTML = "O bot está: Desligado"
    }
    socket.emit('statusBot', mask.unmaskedValue)
})

function activatedBot() {
    if (localStorage.getItem('statusBot') == 'true'){
        localStorage.setItem('statusBot', 'false');
        location.reload();
        socket.emit('activatedBot', { status:'false', session: localStorage.getItem("session") })
    }else{
        localStorage.setItem('statusBot', 'true');
        location.reload();
        socket.emit('activatedBot', { status:'true', session: localStorage.getItem("session") })

    }
}

function configSession(){
    var session = localStorage.getItem('session')
    socket.emit('configSession', session)
    socket.on('configSession', (data) => {
        let ownerSession = data["ownerClient"]
        let establishmentSession = data["establishment"]
        console.log(ownerSession, establishmentSession)
        if (ownerSession == null || ownerSession == '' || establishmentSession == null || establishmentSession == ''){
            document.getElementById('addConfig').style.display = 'block';
        }else{
            document.getElementById('addConfig').style.display = 'none';
            var establishmentDisabled = document.getElementById("establishment");
            establishmentDisabled.setAttribute("disabled", "disabled");
            var ownerDisabled = document.getElementById("owner");
            ownerDisabled.setAttribute("disabled", "disabled");
            document.getElementById('establishment').value = establishmentSession;
            document.getElementById('owner').value = ownerSession;
        }
    })
}

function updateSession(){
    var session = localStorage.getItem('session')
    var establishment = document.getElementById('establishment').value
    var owner = document.getElementById('owner').value
    socket.emit('dataSession', { 'session': session, 'establishment': establishment, 'owner': owner })
    location.reload();
}

function exitSession() {
    localStorage.clear();
    location.reload();
}
