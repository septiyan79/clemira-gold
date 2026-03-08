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
                            <div className="row g-4">
                                {/* <!-- Product Card 1 --> */}
                                <div className="col-sm-6 col-md-4 col-lg-4">
                                    <div className="card shadow-sm">
                                        <img src="/sale-product/sampel1.jpeg" className="card-img-top" alt="Produk 1" />
                                        <div className="card-body">
                                            <h5 className="card-title">Antam 2 gr</h5>
                                            <small>1 Keping</small>
                                            <p className="card-text text-muted">Redmark, kulit ari lengkap, mulus.</p>
                                            <p className="price">Rp ???</p>
                                            <a href="https://wa.me/6285975459997?text=Halo,%20Mau%20info%20Sale%20Antam%20nya%20min!" target="blank" className="btn btn-gold w-100">Beli!</a>
                                        </div>
                                    </div>
                                </div>

                                {/* <!-- Product Card 2 --> */}
                                <div className="col-sm-6 col-md-4 col-lg-4">
                                    <div className="card shadow-sm">
                                        <img src="/sale-product/sampel2.jpeg" className="card-img-top" alt="Produk 2" />
                                        <div className="card-body">
                                            <h5 className="card-title">Antam 1 gr</h5>
                                            <small>5 Keping</small>
                                            <p className="card-text text-muted">Redmark, kulit ari lengkap, mulus.</p>
                                            <p className="price">Rp ???</p>
                                            <a href="https://wa.me/6285975459997?text=Halo,%20Mau%20info%20Sale%20Antam%20nya%20min!" target="blank" className="btn btn-gold w-100">Beli!</a>
                                        </div>
                                    </div>
                                </div>

                                {/* <!-- Product Card 3 --> */}
                                <div className="col-sm-6 col-md-4 col-lg-4">
                                    <div className="card shadow-sm">
                                        <img src="/sale-product/sampel3.jpeg" className="card-img-top" alt="Produk 3" />
                                        <div className="card-body">
                                            <h5 className="card-title">Antam 50 gr</h5>
                                            <small>1 Keping</small>
                                            <p className="card-text text-muted">Redmark, kulit ari lengkap, mulus.</p>
                                            <p className="price">Rp ???</p>
                                            <a href="https://wa.me/6285975459997?text=Halo,%20Mau%20info%20Sale%20Antam%20nya%20min!" target="blank" className="btn btn-gold w-100">Beli!</a>
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
