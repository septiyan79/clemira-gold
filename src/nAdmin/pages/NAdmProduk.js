// src/nAdmin/pages/NAdmProduk.js
import React, { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import DataTable from "react-data-table-component";
import "bootstrap/dist/css/bootstrap.min.css";

export default function NAdmProduk() {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [entries, setEntries] = useState(10);
    const [loading, setLoading] = useState(false);
    const [editProduct, setEditProduct] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        brand: "",
        type: "",
        weight: "",
        unit: "gram",
        slug: "",
        active: true,
    });

    // 🔁 Realtime listener
    useEffect(() => {
        const unsub = onSnapshot(collection(db, "products"), (snapshot) => {
            const list = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
            setProducts(list);
            setFilteredProducts(list);
        });
        return () => unsub();
    }, []);

    // 🔍 Filter pencarian
    useEffect(() => {
        const result = products.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.brand.toLowerCase().includes(search.toLowerCase()) ||
            p.type.toLowerCase().includes(search.toLowerCase())
        );
        setFilteredProducts(result);
    }, [search, products]);

    // 🧩 Handle input
    const handleNameChange = (e) => {
        const value = e.target.value;
        setFormData({
            ...formData,
            name: value,
            slug: value.toLowerCase().replace(/\s+/g, "-"),
        });
    };

    // ➕ Tambah produk
    const handleAddProduct = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await addDoc(collection(db, "products"), {
                ...formData,
                weight: parseFloat(formData.weight),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            setFormData({
                name: "",
                brand: "",
                type: "",
                weight: "",
                unit: "gram",
                slug: "",
                active: true,
            });
            document.getElementById("closeModalBtn").click();
        } catch (err) {
            console.error("Error adding product:", err);
            alert("Gagal menambah produk.");
        } finally {
            setLoading(false);
        }
    };

    // ✏️ Simpan edit
    const handleSaveEdit = async () => {
        try {
            const productRef = doc(db, "products", editProduct.id);
            await updateDoc(productRef, {
                name: editProduct.name,
                brand: editProduct.brand,
                type: editProduct.type,
                weight: parseFloat(editProduct.weight),
                unit: editProduct.unit,
                slug: editProduct.slug,
                active: editProduct.active,
                updatedAt: serverTimestamp(),
            });
            setEditProduct(null);
        } catch (err) {
            console.error("Error updating product:", err);
            alert("Gagal update produk.");
        }
    };

    // 🗑️ Hapus produk
    const handleDelete = async (id) => {
        if (!window.confirm("Yakin ingin menghapus produk ini?")) return;
        try {
            await deleteDoc(doc(db, "products", id));
        } catch (err) {
            console.error("Error deleting product:", err);
            alert("Gagal hapus produk.");
        }
    };

    // Kolom tabel
    const columns = [
        { name: "Name", selector: (row) => row.name, sortable: true },
        { name: "Brand", selector: (row) => row.brand, sortable: true },
        { name: "Type", selector: (row) => row.type },
        { name: "Weight", selector: (row) => `${row.weight} ${row.unit}` },
        { name: "Slug", selector: (row) => row.slug },
        {
            name: "Active",
            cell: (row) =>
                row.active ? (
                    <span className="badge bg-success">Yes</span>
                ) : (
                    <span className="badge bg-secondary">No</span>
                ),
        },
        {
            name: "Actions",
            cell: (row) => (
                <>
                    <button
                        className="btn btn-sm btn-primary me-2"
                        onClick={() => setEditProduct(row)}
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDelete(row.id)}
                    >
                        <i className="fas fa-trash"></i>
                    </button>
                </>
            ),
        },
    ];

    return (
        <>
            {/* 🔹 Breadcrumb & Judul */}
            <div className="page-breadcrumb">
                <div className="row">
                    <div className="col-5 align-self-center">
                        <h4 className="page-title">Products</h4>
                    </div>
                    <div className="col-7 align-self-center">
                        <div className="d-flex align-items-center justify-content-end">
                            <nav aria-label="breadcrumb">
                                <ol className="breadcrumb mb-0">
                                    <li className="breadcrumb-item"><a href="#">Admin</a></li>
                                    <li className="breadcrumb-item active" aria-current="page">Products</li>
                                </ol>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔹 Card Table */}
            <div className="container-fluid">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-body">
                                {/* Header Card */}
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <h4 className="card-title mb-2.5">List of Products</h4>
                                        <h6 className="card-subtitle text-muted">Manajemen data produk CGold</h6>
                                    </div>
                                    {/* <button
                                        className="btn btn-primary"
                                        data-bs-toggle="modal"
                                        data-bs-target="#addProductModal"
                                    >
                                        + Add Product
                                    </button> */}
                                </div>

                                {/* Action Bar (Search + Add Button) */}
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <button
                                        className="btn btn-primary btn-sm"
                                        data-bs-toggle="modal"
                                        data-bs-target="#addProductModal"
                                    >
                                        + Add Product
                                    </button>

                                    <input
                                        type="text"
                                        placeholder="Search..."
                                        className="form-control form-control-sm"
                                        style={{ maxWidth: "200px" }}
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                    />
                                </div>



                                {/* Tabel Produk */}
                                <div className="table-responsive">
                                    <DataTable
                                        columns={columns}
                                        data={filteredProducts} // hapus slice(0, entries)
                                        pagination
                                        highlightOnHover
                                        striped
                                        dense
                                    />

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 🔹 Modal Tambah Produk */}
            <div
                className="modal fade"
                id="addProductModal"
                tabIndex="-1"
                aria-hidden="true"
            >
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">Add Product</h5>
                            <button
                                type="button"
                                className="btn-close"
                                data-bs-dismiss="modal"
                                aria-label="Close"
                                id="closeModalBtn"
                            ></button>
                        </div>
                        <form onSubmit={handleAddProduct}>
                            <div className="modal-body px-4 py-3">
                                <div className="mb-2">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.name}
                                        onChange={handleNameChange} // slug dibuat otomatis di sini
                                        required
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Brand</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.brand}
                                        onChange={(e) =>
                                            setFormData({ ...formData, brand: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Type</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.type}
                                        onChange={(e) =>
                                            setFormData({ ...formData, type: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                                <div className="row">
                                    <div className="col-6 mb-2">
                                        <label className="form-label">Weight</label>
                                        <input
                                            type="number"
                                            className="form-control"
                                            value={formData.weight}
                                            onChange={(e) =>
                                                setFormData({ ...formData, weight: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="col-6 mb-2">
                                        <label className="form-label">Unit</label>
                                        <select
                                            className="form-select"
                                            value={formData.unit}
                                            onChange={(e) =>
                                                setFormData({ ...formData, unit: e.target.value })
                                            }
                                        >
                                            <option value="gram">gram</option>
                                            <option value="kg">kg</option>
                                        </select>
                                    </div>
                                </div>

                                <hr />
                                <div className="d-flex align-items-center mb-3 justify-content-center">
                                    <div className="form-check form-switch me-2">
                                        <input
                                            className="form-check-input"
                                            type="checkbox"
                                            id="activeSwitch"
                                            checked={formData.active}
                                            onChange={(e) =>
                                                setFormData({ ...formData, active: e.target.checked })
                                            }
                                        />
                                        <label className="form-check-label" htmlFor="activeSwitch"></label>
                                    </div>
                                    {formData.active ? (
                                        <span className="badge bg-success">Active</span>
                                    ) : (
                                        <span className="badge bg-secondary">Inactive</span>
                                    )}
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    data-bs-dismiss="modal"
                                >
                                    Close
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? "Saving..." : "Save"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>


            {/* 🔹 Modal Edit Produk */}
            {editProduct && (
                <>
                    <div className="modal show d-block" tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Edit Product</h5>
                                    <button
                                        type="button"
                                        className="btn-close"
                                        onClick={() => setEditProduct(null)}
                                    ></button>
                                </div>
                                <div className="modal-body px-4 py-3">
                                    <div className="mb-2">
                                        <label className="form-label">Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editProduct.name}
                                            onChange={(e) =>
                                                setEditProduct({
                                                    ...editProduct,
                                                    name: e.target.value,
                                                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                                                })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label">Brand</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editProduct.brand}
                                            onChange={(e) =>
                                                setEditProduct({ ...editProduct, brand: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="mb-2">
                                        <label className="form-label">Type</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={editProduct.type}
                                            onChange={(e) =>
                                                setEditProduct({ ...editProduct, type: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                    <div className="row">
                                        <div className="col-6 mb-2">
                                            <label className="form-label">Weight</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={editProduct.weight}
                                                onChange={(e) =>
                                                    setEditProduct({ ...editProduct, weight: e.target.value })
                                                }
                                                required
                                            />
                                        </div>
                                        <div className="col-6 mb-2">
                                            <label className="form-label">Unit</label>
                                            <select
                                                className="form-select"
                                                value={editProduct.unit}
                                                onChange={(e) =>
                                                    setEditProduct({ ...editProduct, unit: e.target.value })
                                                }
                                            >
                                                <option value="gram">gram</option>
                                                <option value="kg">kg</option>
                                            </select>
                                        </div>
                                    </div>

                                    <hr />
                                    <div className="d-flex align-items-center mb-3 justify-content-center">
                                        <div className="form-check form-switch me-2">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="activeSwitchEdit"
                                                checked={editProduct.active}
                                                onChange={(e) =>
                                                    setEditProduct({
                                                        ...editProduct,
                                                        active: e.target.checked,
                                                    })
                                                }
                                            />
                                            <label
                                                className="form-check-label"
                                                htmlFor="activeSwitchEdit"
                                            ></label>
                                        </div>
                                        {editProduct.active ? (
                                            <span className="badge bg-success">Active</span>
                                        ) : (
                                            <span className="badge bg-secondary">Inactive</span>
                                        )}
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => setEditProduct(null)}
                                    >
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
