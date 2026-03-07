import React from "react";

export default function Home() {
    return (
        <section className="page-section cta">
            <div className="container">
                <div className="row">
                    <div className="col-xl-9 mx-auto">
                        <div className="cta-inner bg-faded text-center rounded">
                            <h2 className="section-heading mb-4">
                                <span className="section-heading-upper text-gold">Daily Update</span>
                                <span className="section-heading-lower">Sale Hari Ini</span>
                            </h2>
                            <hr></hr>
                            <div class="row g-4">
                                {/* <!-- Product Card 1 --> */}
                                <div class="col-sm-6 col-md-4 col-lg-4">
                                    <div class="card shadow-sm">
                                        <img src="https://via.placeholder.com/300x200?text=Produk+1" class="card-img-top" alt="Produk 1" />
                                        <div class="card-body">
                                            <h5 class="card-title">Produk Premium 1</h5>
                                            <p class="card-text text-muted">Deskripsi singkat produk premium yang sedang sale.</p>
                                            <p class="price">Rp 150.000</p>
                                            <a href="#" class="btn btn-gold w-100">Beli Sekarang</a>
                                        </div>
                                    </div>
                                </div>

                                {/* <!-- Product Card 2 --> */}
                                <div class="col-sm-6 col-md-4 col-lg-4">
                                    <div class="card shadow-sm">
                                        <img src="https://via.placeholder.com/300x200?text=Produk+2" class="card-img-top" alt="Produk 2" />
                                        <div class="card-body">
                                            <h5 class="card-title">Produk Premium 2</h5>
                                            <p class="card-text text-muted">Produk elegan dengan diskon spesial hari ini.</p>
                                            <p class="price">Rp 99.000</p>
                                            <a href="#" class="btn btn-gold w-100">Beli Sekarang</a>
                                        </div>
                                    </div>
                                </div>

                                {/* <!-- Product Card 3 --> */}
                                <div class="col-sm-6 col-md-4 col-lg-4">
                                    <div class="card shadow-sm">
                                        <img src="https://via.placeholder.com/300x200?text=Produk+3" class="card-img-top" alt="Produk 3" />
                                        <div class="card-body">
                                            <h5 class="card-title">Produk Premium 3</h5>
                                            <p class="card-text text-muted">Produk istimewa dengan harga terbaik minggu ini.</p>
                                            <p class="price">Rp 120.000</p>
                                            <a href="#" class="btn btn-gold w-100">Beli Sekarang</a>
                                        </div>
                                    </div>
                                </div>


                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </section >
    );
}
