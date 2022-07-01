
const socket = io("http://localhost:3000");
function criarSessao() {
    socket.emit("create-session", { id: document.getElementById('idInput').value });
}
socket.on("attempts", (data) => {
    console.log(data)
    socket.emit("chamarqr", document.getElementById("idInput").value)
});

socket.on('qrcode', (data) => {
    document.getElementById("textID").style.display = "block";
    document.getElementById("textID").innerHTML = "<b>Id da instancia: </b>" + document.getElementById('idInput').value;
    document.getElementById("img1").src = data + "?" + new Date().getTime()
    socket.emit('qrcode', "QRcodes/" + document.getElementById("idInput").value + ".png")
});

socket.on('message', (data) => {
    document.querySelector("h3").innerHTML = data
    socket.emit("message")
    document.getElementById("img1").remove();
    socket.disconnect(true);
})