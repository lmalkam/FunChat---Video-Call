import React from 'react'

interface UserListProps {
  users: string[]
}

const UserList: React.FC<UserListProps> = ({ users }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-2">Participants</h2>
      <ul>
        {users.map((user, index) => (
          <li key={index} className="py-2 border-b last:border-b-0">
            {user}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default UserList

