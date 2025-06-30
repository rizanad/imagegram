import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUserAuth } from "../../context/userAuthContext";

type UserData = {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
};

const UserList = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const { user } = useUserAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const allUsers: UserData[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data() as UserData;
          // Skip current logged-in user
          if (data.uid !== user?.uid) {
            allUsers.push(data);
          }
        });

        setUsers(allUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    fetchUsers();
  }, [user]);

  return (
    <div>
      <h2>Suggested Users</h2>
      {users.length === 0 ? (
        <p>No other users found.</p>
      ) : (
        <ul>
          {users.map((u) => (
            <li
              key={u.uid}
              style={{ marginBottom: "10px" }}
              className="flex items-center gap-3"
            >
              {u.photoURL && (
                <div>
                  <img
                    src={u.photoURL}
                    alt={u.displayName}
                    width={50}
                    height={50}
                    style={{ borderRadius: "50%", marginTop: "5px" }}
                  />
                </div>
              )}
              <p className="font-semibold">{u.displayName}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UserList;
