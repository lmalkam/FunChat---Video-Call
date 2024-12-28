import React from 'react'

interface ControlsProps {
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onEndCall: () => void
}

const Controls: React.FC<ControlsProps> = ({
  isAudioEnabled,
  isVideoEnabled,
  onToggleAudio,
  onToggleVideo,
  onEndCall,
}) => {
  return (
    <div className="flex justify-center space-x-4">
      <button
        onClick={onToggleAudio}
        className={`${
          isAudioEnabled ? 'bg-blue-500 hover:bg-blue-700' : 'bg-red-500 hover:bg-red-700'
        } text-white font-bold py-2 px-4 rounded`}
      >
        {isAudioEnabled ? 'Mute Audio' : 'Unmute Audio'}
      </button>
      <button
        onClick={onToggleVideo}
        className={`${
          isVideoEnabled ? 'bg-blue-500 hover:bg-blue-700' : 'bg-red-500 hover:bg-red-700'
        } text-white font-bold py-2 px-4 rounded`}
      >
        {isVideoEnabled ? 'Disable Video' : 'Enable Video'}
      </button>
      <button
        onClick={onEndCall}
        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
      >
        End Call
      </button>
    </div>
  )
}

export default Controls

