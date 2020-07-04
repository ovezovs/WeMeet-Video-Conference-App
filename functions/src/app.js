const form = document.getElementById('registration')
form.addEventListener('submit', event => {
    event.preventDefault()

    // remote API endpoint on Netlify
    let url = 'https://eloquent-easley-1fbf82.netlify.app/.netlify/functions/session' 
    
    if(location.hostname == 'localhost') {
        url = 'http://localhost:9000/session'
    }

    fetch(url, {
        method: 'POST',
        body: JSON.stringify({ name: form.elements.name.value })
    }).then(res => res.json()).then(res => {
        const session = OT.initSession(res.apiKey, res.sessionId)  // initialize the session on the client
        const publisher = OT.initPublisher(document.getElementById("publishers"))           // create publisher, by default it is the camera
        //connect to the session and then immediately publish the publisher
        session.connect(res.token, () => {
            session.publish(publisher)
        })
        // when someone else joins, subscribe to the stream
        session.on('streamCreated', event => {
            session.subscribe(event.stream)
        })
    })
})