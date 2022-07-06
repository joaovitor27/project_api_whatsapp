const socket = io("http://3.92.199.163");

if (localStorage.getItem('session') == null){
    document.getElementById('activatedBot').style.display = 'none';
    document.getElementById('formulario').style.display = 'block';
} else {
    document.getElementById('formulario').style.display = 'none';
    document.getElementById('activatedBot').style.display = 'block';
}
function criarSessao() {
    socket.emit("create-session", { id: document.getElementById('idInput').value });
    document.getElementById("carregando").style.display = 'block'
    localStorage.setItem('session', document.getElementById('idInput').value);
}
socket.on("attempts", (data) => {
    console.log(data)
    socket.emit("chamarqr", document.getElementById("idInput").value)
});

socket.on('qrcode', (data) => {
    document.getElementById("textID").style.display = "block";
    document.getElementById("textID").innerHTML = "<b>Id da instancia: </b>" + document.getElementById('idInput').value;
    document.getElementById("carregando").style.display = 'none'
    document.getElementById("img1").src = data + "?" + new Date().getTime()
    socket.emit('qrcode', "QRcodes/" + document.getElementById("idInput").value + ".png")
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
        document.getElementById("activated").innerHTML = "Desligar"
        document.getElementById("statusBot").innerHTML = "O bot está: Ligado"
    }else{
        document.getElementById("activated").innerHTML = "Ligar"
        document.getElementById("statusBot").innerHTML = "O bot está: Desligado"
    }
})

function activatedBot() {
    if (localStorage.getItem('statusBot') == 'true'){
        localStorage.setItem('statusBot', 'false');
        socket.emit('activatedBot', { status:'false', session: localStorage.getItem("session") })
    }else{
        localStorage.setItem('statusBot', 'true');
        socket.emit('activatedBot', { status:'true', session: localStorage.getItem("session") })

    }
}
