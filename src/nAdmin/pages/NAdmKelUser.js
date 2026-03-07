import { useEffect, useState, useRef } from "react";
import $ from "jquery";
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../../firebase";

export default function NAdmKelolaUser() {
    const [users, setUsers] = useState([]);
    const [editUser, setEditUser] = useState(null);
    const tableRef = useRef(null); // 🔹 simpan instance DataTable

    // 🔹 Ambil data user dari Firestore
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "users"));
                const data = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setUsers(data);
            } catch (error) {
                console.error("Error fetching users: ", error);
            }
        };
        fetchUsers();
    }, []);

    // 🔹 Inisialisasi DataTable hanya sekali
    useEffect(() => {
        if (users.length === 0) return;

        const tableEl = $("#zero_config");

        // jika belum pernah diinisialisasi
        if (!tableRef.current) {
            tableRef.current = tableEl.DataTable({
                paging: true,
                searching: true,
                ordering: true,
                autoWidth: false,
                language: {
                    url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/en-GB.json",
                },
            });
        } else {
            // kalau sudah ada → update isi tabel tanpa destroy
            const table = tableRef.current;
            table.clear();
            users.forEach((u) => {
                table.row.add([
                    u.email || "-",
                    u.membership || "-",
                    u.role || "-",
                    `
                    <button class='btn btn-sm btn-primary me-2 edit-btn' data-id='${u.id}'>
                        <i class='fas fa-edit'></i>
                    </button>
                    <button class='btn btn-sm btn-danger delete-btn' data-id='${u.id}'>
                        <i class='fas fa-trash'></i>
                    </button>
                    `,
                ]);
            });
            table.draw();
        }

        // cleanup optional (kalau page unmount)
        return () => {
            if (tableRef.current) {
                tableRef.current.destroy();
                tableRef.current = null;
            }
        };
    }, [users]);

    // Handler
    const handleEdit = (user) => setEditUser(user);

    const handleSaveEdit = async () => {
        try {
            const userRef = doc(db, "users", editUser.id);
            await updateDoc(userRef, {
                email: editUser.email,
                membership: editUser.membership,
                role: editUser.role,
            });
            setUsers((prev) =>
                prev.map((u) => (u.id === editUser.id ? { ...u, ...editUser } : u))
            );
            alert("User berhasil diperbarui!");
            setEditUser(null);
        } catch (error) {
            console.error("Error updating user: ", error);
            alert("Gagal update user");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Yakin ingin menghapus user ini?")) {
            try {
                await deleteDoc(doc(db, "users", id));
                setUsers((prev) => prev.filter((user) => user.id !== id));
                alert("User berhasil dihapus!");
            } catch (error) {
                console.error("Error deleting user: ", error);
                alert("Gagal hapus user");
            }
        }
    };

    return (
        <>
            <div className="page-breadcrumb">
                <div className="row">
                    <div className="col-5 align-self-center">
                        <h4 className="page-title">User Management</h4>
                    </div>
                    <div className="col-7 align-self-center">
                        <div className="d-flex align-items-center justify-content-end">
                            <nav aria-label="breadcrumb">
                                <ol className="breadcrumb">
                                    <li className="breadcrumb-item"><a href="#">User</a></li>
                                    <li className="breadcrumb-item active" aria-current="page">User Management</li>
                                </ol>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                <h4 className="card-title">List of User</h4>
                                <h6 className="card-subtitle">User yang sudah terdaftar di aplikasi.</h6>
                                <div className="table-responsive">
                                    <table id="zero_config" className="table table-striped table-bordered">
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
                                                    <td>{user.membership || "-"}</td>
                                                    <td>{user.role || "-"}</td>
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
                                        <tfoot>
                                            <tr>
                                                <th>Email</th>
                                                <th>Membership</th>
                                                <th>Role</th>
                                                <th>Actions</th>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Edit */}
            {editUser && (
                <>
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
                                    <button className="btn btn-secondary" onClick={() => setEditUser(null)}>
                                        Batal
                                    </button>
                                    <button className="btn btn-primary" onClick={handleSaveEdit}>
                                        Simpan
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show"></div>
                </>
            )}
        </>
    );
}
