
  // Function to get URL query parameters
  function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
//   function getQueryParameter(name) {
//     const urlParams = new URLSearchParams(window.location.search);
//     return urlParams.get(name);
//   }


  // Get the username and aptCode from the URL
  const username = getQueryParameter('username');
  const aptCode = getQueryParameter('aptCode');
  const user = getQueryParameter('c');

  // Now you can use username and aptCode as needed in your Agora video call application


document.getElementById('join-wrapper').style.display = 'none'


//#1
let client = AgoraRTC.createClient({mode:'rtc', codec:"vp8"})

//#2
let config = {
    appid:'9252f7bacb35417e9effa179f879b90b',
    token:null,
    uid:username,
    channel:aptCode,
}

//#3 - Setting tracks for when user joins
let localTracks = {
    audioTrack:null,
    videoTrack:null
}

//#4 - Want to hold state for users audio and video so user can mute and hide
let localTrackState = {
    audioTrackMuted:false,
    videoTrackMuted:false
}

//#5 - Set remote tracks to store other users
let remoteTracks = {}






// document.getElementById('join-btn').addEventListener('click', async () => {
//     config.uid = username
//     await joinStreams()
//     document.getElementById('join-wrapper').style.display = 'none'
//     document.getElementById('footer').style.display = 'flex'
// })



const checkUser = async () => {
    let completeBtn = document.getElementById('complete-btn');
    let completeWrapper = document.getElementById('complete');
    if (user == 'patient') {
      completeWrapper.style.display = 'none';
    } else {
      completeBtn.addEventListener('click', async () => {
        const aptUrl = `https://localhost:44339/api/app/appointment/call-consultation-appointment?appCode=${aptCode}`;
  
        try {
          await fetch(aptUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': 'text/plain',
            },
            body: {},
          })
          .then(async (data) => {
            // Handle successful API response here
  
            // Leave the call
            leaveCall();
          })
          .catch((error) => {
            console.error('Error:', error);
          });
        } catch (error) {
          // Handle any errors
        }
      });
    }
  }
  
  // Function to leave the call
  const leaveCall = async () => {
    for (trackName in localTracks) {
      let track = localTracks[trackName];
      if (track) {
        track.stop();
        track.close();
        localTracks[trackName] = null;
      }
    }
  
    // Leave the channel
    await client.leave();
    document.getElementById('footer').style.display = 'none';
    document.getElementById('user-streams').innerHTML = '';
    document.getElementById('join-wrapper').style.display = 'none';
  
    // Redirect to a different page
    window.location.href = 'https://soowgood.com'; // Replace with the URL you want to navigate to
  }

checkUser()



document.getElementById('mic-btn').addEventListener('click', async () => {
    //Check if what the state of muted currently is
    //Disable button
    if(!localTrackState.audioTrackMuted){
        //Mute your audio
        await localTracks.audioTrack.setMuted(true);
        localTrackState.audioTrackMuted = true
        document.getElementById('mic-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
    }else{
        await localTracks.audioTrack.setMuted(false)
        localTrackState.audioTrackMuted = false
        document.getElementById('mic-btn').style.backgroundColor ='#1f1f1f8e'

    }

})



document.getElementById('camera-btn').addEventListener('click', async () => {
    //Check if what the state of muted currently is
    //Disable button
    if(!localTrackState.videoTrackMuted){
        //Mute your audio
        await localTracks.videoTrack.setMuted(true);
        localTrackState.videoTrackMuted = true
        document.getElementById('camera-btn').style.backgroundColor ='rgb(255, 80, 80, 0.7)'
    }else{
        await localTracks.videoTrack.setMuted(false)
        localTrackState.videoTrackMuted = false
        document.getElementById('camera-btn').style.backgroundColor ='#1f1f1f8e'

    }

})



document.getElementById('leave-btn').addEventListener('click', async () => {
    leaveCall();
})




//Method will take all my info and set user stream in frame
let joinStreams = async () => {
  

    //Is this place hear strategicly or can I add to end of method?
    config.uid = username
   
    client.on("user-published", handleUserJoined);
    client.on("user-left", handleUserLeft);


    client.enableAudioVolumeIndicator(); // Triggers the "volume-indicator" callback event every two seconds.
    client.on("volume-indicator", function(evt){
        for (let i = 0; evt.length > i; i++){
            let speaker = evt[i].uid
            let volume = evt[i].level
            if(volume > 0){
                document.getElementById(`volume-${speaker}`).src = './assets/volume-on.svg'
            }else{
                document.getElementById(`volume-${speaker}`).src = './assets/volume-off.svg'
            }
            
        
            
        }
    });

    //#6 - Set and get back tracks for local user
    [config.uid, localTracks.audioTrack, localTracks.videoTrack] = await  Promise.all([
        client.join(config.appid, config.channel, config.token ||null, config.uid ||null),
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()

    ])

    //#7 - Create player and add it to player list
    let player = `<div class="video-containers" id="video-wrapper-${config.uid}">
                        <p class="user-uid"><i class="volume-icon fa fa-volume-up" id="volume-${config.uid}"> </i> ${config.uid}</p>
                        <div class="video-player player" id="stream-${config.uid}"></div>
                  </div>`

    document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
    //#8 - Player user stream in div
    localTracks.videoTrack.play(`stream-${config.uid}`)
    

    //#9 Add user to user list of names/ids

    //#10 - Publish my local video tracks to entire channel so everyone can see it
    await client.publish([localTracks.audioTrack, localTracks.videoTrack])
    document.getElementById('footer').style.display = 'flex'

}



let handleUserJoined = async (user, mediaType) => {
    console.log('Handle user joined')

    //#11 - Add user to list of remote users
    remoteTracks[user.uid] = user

    //#12 Subscribe ro remote users
    await client.subscribe(user, mediaType)
   
    
    if (mediaType === 'video'){
        let player = document.getElementById(`video-wrapper-${user.uid}`)
        console.log('player:', player)
        if (player != null){
            player.remove()
        }
 
        player = `<div class="video-containers" id="video-wrapper-${user.uid}">
                        <p class="user-uid"><img class="volume-icon" id="volume-${user.uid}" src="./assets/volume-on.svg" /> ${user.uid}</p>
                        <div  class="video-player player" id="stream-${user.uid}"></div>
                      </div>`
        document.getElementById('user-streams').insertAdjacentHTML('beforeend', player);
         user.videoTrack.play(`stream-${user.uid}`)

        

          
    }
    

    if (mediaType === 'audio') {
        user.audioTrack.play();
      }
}


let handleUserLeft = (user) => {
    console.log('Handle user left!')
    //Remove from remote users and remove users video wrapper
    delete remoteTracks[user.uid]
    document.getElementById(`video-wrapper-${user.uid}`).remove()
}

joinStreams(); 


