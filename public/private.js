var socket = io.connect('http://localhost:3000');
// var socket = io.connect('https://remah-3rabi.herokuapp.com');
const personName = document.getElementById('personName').value
const personId = document.getElementById('personId').value
const toName = document.getElementById('toName').value
const toId = document.getElementById('toId').value
const personImageUrl = document.getElementById('personImageUrl').value
const pvt = document.getElementById('pvt')
document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;

socket.emit('private-connected',personName)

document.getElementById('send').addEventListener('click',()=>{
    if (document.getElementById('textarea1').value !== '' ){
        var msg = document.getElementById('textarea1').value
        document.getElementById('textarea1').value = '' 
        appendMessage(msg,personName,personImageUrl)
        document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
        socket.emit('private',msg,toName,personName,personImageUrl,personId,toId)
    }
})

document.getElementById('textarea1').addEventListener('keyup',(event)=>{ 
    if (document.getElementById('textarea1').value !== '' ){
        if (event.keyCode === 13){
            var msg = document.getElementById('textarea1').value
            document.getElementById('textarea1').value = '' 
            appendMessage(msg,personName,personImageUrl)
            document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
            socket.emit('private',msg,toName,personName,personImageUrl,personId,toId,new Date().toLocaleTimeString().replace(/:\d+ /, ' ') +' ' + new Date().toDateString().substr(4))
        }
    }
})

socket.on('private',(msg,senderName,senderImageUrl)=>{
    if(toName == senderName){
        appendMessage(msg,senderName,senderImageUrl)
        document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
    }
})

function appendMessage(message,name,imageUrl) {
    document.getElementById('chat').innerHTML += 
    // '<p><strong>' + message + '</strong></p>'
    '<li class="collection-item avatar #fffde7 yellow lighten-5">'+
      '<i class="material-icons circle"> '+
          `<img src="${imageUrl}" width="40px" height="40px" >`+
      '</i>'+
      '<span class="title"><strong>'+name+' </strong> </span>'+
      '<p class="black-text">'+message+'</p>'+
      '<a href="" class="secondary-content">'+
        // '<i class="material-icons orange-text">mood</i>'+
        '<span class= "orange-text">'+new Date().toLocaleTimeString().replace(/:\d+ /, ' ') +' ' + new Date().toDateString().substr(4)+'</span>'+
      '</a>'+
    '</li>'
    }

socket.on('send-image',(data,senderId) => {
    if(personId.toString() != senderId.toString()){
        document.getElementById('chat').innerHTML += 
        '<li class="collection-item avatar #fffde7 yellow lighten-5">'+
            '<i class="material-icons circle"> '+
                `<img src="${data.personImageUrl}" width="40px" height="40px" >`+
            '</i>'+
            '<span class="title" style="display: block;"><strong>'+data.personName+' </strong> </span>'+
            `<img src="${data.message}" width="500px" height="500px" >`+
            '<a href="" class="secondary-content">'+
            '<span class="orange-text">'+data.Date+'</span>'+
            '</a>'+
        '</li>'
        document.getElementById("chat").scrollTop = document.getElementById("chat").scrollHeight;
    }
    // socket.emit('send-image',data,personId,new Date().toLocaleTimeString().replace(/:\d+ /, ' ') +' ' + new Date().toDateString().substr(4))
})