import React, { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import UserList from './UserList'
import ChatBox from './ChatBox'
import Controls from './Controls'

const VideoChat: React.FC = () => {
  const [users, setUsers] = useState<string[]>([])
  const [messages, setMessages] = useState<{ username: string; message: string }[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [isAudioEnabled, setIsAudioEnabled] = useState(true)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [username, setUsername] = useState('')
  const [isCallStarted, setIsCallStarted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const socketRef = useRef<Socket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    socketRef.current = io('http://localhost:3000')

    socketRef.current.on('connect', () => {
      console.log('Connected to server')
    })

    socketRef.current.on('connect_error', (err) => {
      console.error('Connection error:', err)
      setError('Failed to connect to the server. Please try again.')
    })

    socketRef.current.on('userList', (userList: string[]) => {
      console.log('Updated user list:', userList)
      setUsers(userList)
    })

    socketRef.current.on('chatMessage', (message: { username: string; message: string }) => {
      setMessages(prevMessages => [...prevMessages, message])
    })

    socketRef.current.on('offer', async (offer: RTCSessionDescriptionInit, fromSocketId: string) => {
      console.log('Received offer from:', fromSocketId)
      try {
        if (!peerConnectionRef.current) {
          await createPeerConnection()
        }
        await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(offer))
        const answer = await peerConnectionRef.current!.createAnswer()
        await peerConnectionRef.current!.setLocalDescription(answer)
        console.log('Sending answer to:', fromSocketId)
        socketRef.current!.emit('answer', answer, fromSocketId)
      } catch (err) {
        console.error('Error handling offer:', err)
        setError('Failed to process the call offer. Please try again.')
      }
    })

    socketRef.current.on('answer', async (answer: RTCSessionDescriptionInit) => {
      console.log('Received answer')
      try {
        await peerConnectionRef.current!.setRemoteDescription(new RTCSessionDescription(answer))
      } catch (err) {
        console.error('Error setting remote description:', err)
        setError('Failed to establish the call connection. Please try again.')
      }
    })

    socketRef.current.on('iceCandidate', async (candidate: RTCIceCandidateInit) => {
      console.log('Received ICE candidate')
      try {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
        }
      } catch (err) {
        console.error('Error adding ICE candidate:', err)
      }
    })

    return () => {
      socketRef.current?.disconnect()
      localStream?.getTracks().forEach(track => track.stop())
      peerConnectionRef.current?.close()
    }
  }, [])

  const createPeerConnection = async () => {
    console.log('Creating peer connection')
    try {
      peerConnectionRef.current = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('Sending ICE candidate')
          socketRef.current!.emit('iceCandidate', event.candidate)
        }
      }

      peerConnectionRef.current.ontrack = (event) => {
        console.log('Received remote track', event.streams[0])
        setRemoteStream(event.streams[0])
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      if (!localStream) {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        setLocalStream(stream)
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream
        }
        stream.getTracks().forEach(track => {
          peerConnectionRef.current!.addTrack(track, stream)
        })
      } else {
        localStream.getTracks().forEach(track => {
          peerConnectionRef.current!.addTrack(track, localStream)
        })
      }
    } catch (err) {
      console.error('Error creating peer connection:', err)
      setError('Failed to set up the call. Please check your camera and microphone permissions.')
    }
  }

  const startCall = async () => {
    if (!username) {
      alert('Please enter a username before starting the call')
      return
    }

    try {
      console.log('Starting call')
      socketRef.current!.emit('join', username)
      await createPeerConnection()

      const offer = await peerConnectionRef.current!.createOffer()
      await peerConnectionRef.current!.setLocalDescription(offer)
      console.log('Sending offer')
      socketRef.current!.emit('offer', offer)

      setIsCallStarted(true)
    } catch (err) {
      console.error('Error starting call:', err)
      setError('Failed to start the call. Please try again.')
    }
  }

  const handleSendMessage = (message: string) => {
    socketRef.current!.emit('chatMessage', message)
  }

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled
      })
      setIsAudioEnabled(!isAudioEnabled)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled
      })
      setIsVideoEnabled(!isVideoEnabled)
    }
  }

  const endCall = () => {
    localStream?.getTracks().forEach(track => track.stop())
    peerConnectionRef.current?.close()
    socketRef.current?.disconnect()
    setIsCallStarted(false)
    setLocalStream(null)
    setRemoteStream(null)
    setError(null)
  }

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="flex-grow">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        {!isCallStarted ? (
          <div className="bg-white p-4 rounded-lg shadow">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              className="w-full p-2 mb-4 border rounded"
            />
            <button
              onClick={startCall}
              className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
            >
              Start Call
            </button>
          </div>
        ) : (
          <>
            <div className="bg-black aspect-video rounded-lg shadow-lg mb-4">
              <video
                ref={localVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                muted
                playsInline
              />
            </div>
            <div className="bg-black aspect-video rounded-lg shadow-lg mb-4">
              <video
                ref={remoteVideoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
              />
            </div>
            <Controls
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              onToggleAudio={toggleAudio}
              onToggleVideo={toggleVideo}
              onEndCall={endCall}
            />
          </>
        )}
      </div>
      <div className="w-full md:w-64 flex flex-col gap-4">
        <UserList users={users} />
        <ChatBox messages={messages} onSendMessage={handleSendMessage} />
      </div>
    </div>
  )
}

export default VideoChat

