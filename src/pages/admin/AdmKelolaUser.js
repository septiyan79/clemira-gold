import { useEffect, useState } from "react";
import $ from "jquery";

import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase"; // sesuaikan path

export default function AdmKelolaUser() {
    const [users, setUsers] = useState([]);
    const [editUser, setEditUser] = useState(null);


    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUsers(data);

                // Init DataTable setelah data masuk
                setTimeout(() => {
                    if (!$.fn.DataTable.isDataTable("#userTable")) {
                        $("#userTable").DataTable({
                            responsive: true
                        });
                    }
                }, 500);
            } catch (error) {
                console.error("Error fetching users: ", error);
            }
        };

        fetchUsers();
    }, []);

    // Handler
    const handleEdit = (user) => {
        setEditUser(user);
    };

    const handleSaveEdit = async () => {
        try {
            const userRef = doc(db, "users", editUser.id);
            await updateDoc(userRef, {
                email: editUser.email,
                membership: editUser.membership,
                role: editUser.role
            });

            // update state agar tabel langsung berubah
            setUsers((prevUsers) =>
                prevUsers.map((u) =>
                    u.id === editUser.id ? { ...u, ...editUser } : u
                )
            );

            alert("User berhasil diperbarui!");
            setEditUser(null); // tutup modal
        } catch (error) {
            console.error("Error updating user: ", error);
            alert("Gagal update user");
        }
    };

    // Delete Handler
    const handleDelete = async (id) => {
        if (window.confirm("Yakin ingin menghapus user ini?")) {
            try {
                await deleteDoc(doc(db, "users", id));

                // update state users biar tabel langsung terhapus
                setUsers(prev => prev.filter(user => user.id !== id));

                alert("User berhasil dihapus!");
            } catch (error) {
                console.error("Error deleting user: ", error);
                alert("Gagal hapus user");
            }
        }
    };

    return (
        <main>
            <div className="container-fluid px-4">
                <h1 className="mt-4">Kelola User</h1>
                <ol className="breadcrumb mb-4">
                    <li className="breadcrumb-item"><a href="index.html">Dashboard</a></li>
                    <li className="breadcrumb-item active">User</li>
                </ol>
                <div className="card mb-4">
                    <div className="card-header">
                        <i className="fas fa-users me-1"></i>
                        Data User
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table id="userTable" className="display">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Membership</th>
                                        <th>Role</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.email}</td>
                                            <td>{user.membership}</td>
                                            <td>{user.role}</td>
                                            <td>
                                                <button
                                                    className="btn btn-sm btn-primary me-2"
                                                    onClick={() => handleEdit(user)}
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    className="btn btn-sm btn-danger"
                                                    onClick={() => handleDelete(user.id)}
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Edit */}
            {editUser && (
                <div className="modal show d-block" tabIndex="-1">
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Edit User</h5>
                                <button
                                    type="button"
                                    className="btn-close"
                                    onClick={() => setEditUser(null)}
                                ></button>
                            </div>
                            <div className="modal-body">
                                <div className="mb-3">
                                    <label>Email</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={editUser.email}
                                        onChange={(e) =>
                                            setEditUser({
                                                ...editUser,
                                                email: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                                <div className="mb-3">
                                    <label>Membership</label>
                                    <select
                                        className="form-control"
                                        value={editUser.membership}
                                        onChange={(e) =>
                                            setEditUser({
                                                ...editUser,
                                                membership: e.currentTarget.value,
                                            })
                                        }
                                    >
                                        <option value="Essential">Essential</option>
                                        <option value="Gold">Gold</option>
                                    </select>

                                </div>
                                <div className="mb-3">
                                    <label>Role</label>
                                    <select
                                        className="form-control"
                                        value={editUser.role}
                                        onChange={(e) =>
                                            setEditUser({
                                                ...editUser,
                                                role: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setEditUser(null)}
                                >
                                    Batal
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSaveEdit}
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
