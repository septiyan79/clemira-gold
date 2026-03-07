import React from "react";

export default function AboutPage() {
    return (
        <section class="page-section about-heading">
            <div class="container">
                <img class="img-fluid rounded about-heading-img mb-3 mb-lg-0" src="/assets-dashboard/assets/img/about.jpg" alt="..." />
                <div class="about-heading-content">
                    <div class="row">
                        <div class="col-xl-9 col-lg-10 mx-auto">
                            <div class="bg-faded rounded p-5">
                                <h2 class="section-heading mb-4">
                                    <span class="section-heading-upper text-gold">Emaasmu, Kendalimu</span>
                                    <span class="section-heading-lower">About Clemira Gold</span>
                                </h2>
                                <p>Clemira Gold adalah proyek kecil yang kami kembangkan untuk mempermudah siapa pun memantau harga emas dan buyback secara cepat dan transparan.</p>
                                <p>Aplikasi ini berawal dari kebutuhan pribadi untuk melacak harga harian emas Antam dan dunia, kemudian berkembang menjadi sistem kecil yang dapat membantu pengguna memahami pergerakan harga emas dengan lebih mudah.</p>
                                <p>Di Clemira Gold, semua data harga ditampilkan secara real-time, dengan tampilan yang sederhana dan ramah pengguna.</p>
                                <p>Saya percaya bahwa memahami nilai emas tidak harus rumit — cukup jujur, transparan, dan mudah diakses.</p>
                                <h6 className="fw-semibold text-gold"><em>- Emasmu, kendalimu.</em></h6>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
