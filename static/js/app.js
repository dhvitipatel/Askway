( () => {
    'use strict';

    var pusher =  new Pusher('c8cf2906ac8f38374788', {
        authEndpoint: 'pusher/auth',
        cluster: 'us2',
        encrypted: true
    });

    //Chat functionlity
    // chat object with its keys
    let chat = {
        name: undefined,
        email: undefined,
        mychannel: undefined
    }
    // $() is a jQuery selector, naming is like css almost.
    const chatPage = $(document) 
    const chatWindow = $('.chatbubble')
    const chatHeader = chatWindow.find('.unexpanded')
    const chatBody = chatWindow.find('.chat-window')

    //helper functions
    let helpers = {
        //window toggler
        ToogleChatWindow: () => {
            chatWindow.toggleClass('opened') //toggleClass is a jQ method that toggles the current value
            chatHeader.find('title').text(
                chatWindow.hasClass('opened') ? 'Minimize':  'Chat' //hasClass determies whater any of the matched elements are assigned the class
            )
        },
        //appropriate screening
        ShowAppropriateChatDisplay: () => {
            (chat.name) ? helpers.ShowChatDisplay() : helpers.ShowChatLogin()
        },

        //show Login Screen
        ShowChatLogin: () => {
            chatBody.find('.chats').removeClass('active')
            chatBody.find('.login-screen').addClass('active') //addClass adds specific class name (jQ)
        },

        ShowChatDisplay: () => {
            chatBody.find('.chats').addClass('active')
            chatBody.find('.login-screen').removeClass('active')

            setTimeout( () => { //JS native function that sets atime which executes a function once timer expires
                chatBody.find('.loader-wrapper').hide()
                chatBody.find('input, .messages').show()
            }, 2000)
        },

        //appending msgs to UI
        NewChatMessage: (message) => {
            if(message !== undefined) {
                const messageClass = message.sender !== chat.email ? 'support' : 'user'

                chatBody.find('ul.messages').append(
                    `<li class= "clearfix message ${messageClass}">
                        <div class = "sender"> ${message.name}</div>
                        <div class = "message"> ${message.text}</div>
                    </li>`
                )

                chatBody.scrollTop(chatBody[0].scrollHeight)
            }
        },

        //send msg to chat channel
        SendMessageToSupport: (evt) => {
            evt.preventDefault() //the default action of the event will not be triggered (jQ)
            
            let createdAt =  new Date()
            createdAt = createdAt.toLocaleString()

            const message = $('#newMessage').val().trim() //val gets the value of fist element in set of matched elements,trim removes whitespace

            chat.mychannel.trigger('client-guest-new-message', { //trigger executes all attached to mathced elements for given event type, takes eventType and extra Parameters
                'sender': chat.name,
                'email': chat.email,
                'text': message,
                'createdAt': createdAt
            });

            helpers.NewChatMessage({
                'text': message,
                'name': chat.name,
                'sender': chat.email
            })

            console.log("Message added!")

            $('#newMessage').val('')
        },

        //logs user in a chat session 

        LogIntoChatSession: (evt) => {
            const name = $('#fullname').val().trim()
            const email = $('#email').val().trim().toLowerCase()

            //disabling form here
            chat.find('#loginScreeForm input, #loginScreenForm button').attr('disabled', true)
            
            if((name !== '' && name.length >= 3) && (email !== '' && email.length >= 5)) {
                axios.post('new/guest', {name, email}).then(response => {
                    chat.name = name
                    chat.email = email
                    chat.mychannel = pusher.subscribe('private-' + response.data.email);
                    helpers.ShowAppropriateChatDisplay()
                })
            }
            else{
                alert('Enter a valid name and email.')
            }
            
            evt.preventDefault()
        }
    }

    //Pusher listening for new message from admin

    pusher.bind('client-support-new-message' , (data) => {
        helpers.NewChatMessage(data)
    })

    //Event Listeners
    chatPage.ready(helpers.ShowAppropriateChatDisplay)
    chatHeader.on('Click', helpers.ToogleChatWindow)
    chatBody.find('#loginScreenForm').on('submit', helpers.LogIntoChatSession)
    chatBody.find('#messageSupport').on('submit', helpers.SendMessageToSupport)
});

 