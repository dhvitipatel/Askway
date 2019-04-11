( () => {
    'use strict';

    //Pusher Configuration

    var pusher =  new Pusher('c8cf2906ac8f38374788', {
        authEndpoint: 'pusher/auth',
        cluster: 'us2',
        encrypted: true
    });

    //chat details

    let chat = {
        messages: [],
        currentRoom: '',
        currentChannel: '',
        subscribedChannels: [],
        subscribedUsers: []
    }

    // generalChannel Subscription
    var generalChannel = pusher.subscribe('general-channel');

    //Targetted Elements
    const chatBody = $(document)
    const chatRoomsList = $('#rooms')
    const chatReplyMessage = $('#replyMessage')

    //Helper Functions
    const helpers = {
        clearChatMessages: () => $('#chat-msgs').html(''),

        displayChatMessage: (message) => {
            if(message.email === chat.currentRoom) {
                $('#chat-msgs').prepend(
                    `<tr>
                        <td>
                            <div class="sender">${message.sender} @ <span class="date">${message.createdAt}</span></div>
                            <div class="message">${message.text}</div>
                        </td>
                    </tr>`
                )
            }
        },

        //New Guest Room

        loadChatRoom: evt => {
            chat.currentRoom = evt.target.dataset.roomId
            chat.currentChannel =  evt.target.dataset.channelId

            if(chat.currentRoom !== undefined) {
                $('.response').show()
                $('#room-title').text(evt.target.dataset.roomId)
            }

            evt.preventDefault()
            helpers.clearChatMessages()
        },

        //Reply
        replyMessage: evt => {
            evt.preventDefault()

            let createdAt = new Date()
            createdAt = createdAt.toLocaleString()

            const message = $('#replyMessage input').val().trim()

            chat.subscribedChannels[chat.currentChannel].trigger('client-support-new-message', {
                'name': 'Admin',
                'email': chat.currentRoom,
                'text': message,
                'createsAt': createdAt
            });

            helpers.displayChatMessage({
                'email': chat.currentRoom,
                'sender': 'Support',
                'text': message,
                'createdAt': createdAt
            })

            $('#replyMessage input').val('')
        }
    }

    generalChannel.bind('new-guest-detials', (data) => {
        chat.subscribedChannels.push(pusher.subscribe('private-' + data.email));
        chat.subscribedUsers.push(data);

        $('#rooms').html("");
        chat.subscribedUsers.forEach(( user, index) => {
            $('#rooms').append(
                `<li class="nav-item"><a data-room-id="${user.email}" data-channel-id="${index}" class="nav-link" href="#">${user.name}</a></li>`
            )
        })

        //Listen for new guest message

        pusher.bind('client-guest-new-message', (data) => {
            helpers.displayChatMessage(data)
        })
        
        //Event Listeners
        chatReplyMessage.on('submit', helpers.replyMessage)
        chatRoomsList.on('click', 'li', helpers.loadChatRoom)
    })


})
