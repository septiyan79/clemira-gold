import React from "react";

export default function Home() {
    return (
        <section className="page-section clearfix">
            <div className="container">
                <div className="intro">
                    <img
                        className="intro-img img-fluid mb-3 mb-lg-0 rounded"
                        src="/assets-dashboard/assets/img/intro.jpg"
                        alt="Intro"
                    />
                    <div className="intro-text left-0 text-center bg-faded p-5 rounded">
                        <h2 className="section-heading mb-4">
                            <span className="section-heading-upper">Dashboard</span>
                            <span className="section-heading-lower">Investasi Emas</span>
                        </h2>
                        <p className="mb-3">
                            Ini ruang kendali investasi emas Anda. Dari update harga harian, tracking kepemilikan, hingga kalkulator buyback, semua fitur kami hadir untuk membantu Anda mengelola emas dengan lebih mudah dan transparan.
                        </p>
                        <div className="intro-button mx-auto">
                            <a className="btn btn-gold btn-xl" href="/price">
                                Pantau Harga Emas!
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
