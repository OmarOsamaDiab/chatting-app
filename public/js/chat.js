

const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $loc = document.querySelector('#location')
const $messages = document.querySelector('#messages')
const $locations = document.querySelector('#locations')
const $sidebar = document.querySelector('#sidebar')

// Template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

//options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

$messageForm.addEventListener('submit', e => {
    e.preventDefault()
    $messageFormButton.setAttribute('disabled', 'disabled')
    const message = e.target.elements.message.value
    socket.emit('send-message', message, (message) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

$loc.addEventListener('click', e => {
    $loc.setAttribute('disabled', 'disabled')
    if (!navigator.geolocation) return alert('it is not supported')
    navigator.geolocation.getCurrentPosition((pos) => {
        console.log(pos)
        socket.emit('send-location', { long: pos.coords.longitude, lat: pos.coords.latitude }, (message) => {
            console.log(message)
            $loc.removeAttribute('disabled')
        })
    })
})

socket.on('locationMessage', message => {
    console.log("location:", message)
    const html = Mustache.render(locationTemplate, {
        url: message.url,
        username: message.username,
        createdAt: moment(message.createdAt).format('DD/MMM/YYYY h:mm a')
    })
    $locations.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on('roomData', ({ users, room }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    $sidebar.innerHTML = html
})

socket.on('message', message => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        username: message.username,
        createdAt: moment(message.createdAt).format('DD/MMM/YYYY h:mm a')
    })
    $messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})