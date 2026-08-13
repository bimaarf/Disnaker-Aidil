import React from "react";
import { HomeCarousel } from "./homeCarousel";
import ImagesBg from "./components/Images/header.png";
import { BlogGrid } from "./homeComponents/blogGrid";
import EventsSection from "./homeComponents/_eventSection";
export const Home = () => {
  return (
    <div className="font-sans text-pretty">
      {/* Carousel */}
      <HomeCarousel />
      <div className="bg-white text-black md:p-28 p-4 space-y-10">
        <h1 className="text-center md:text-4xl text-3xl font-light">
          PENDIDIK DAN TENAGA KEPENDIDIKAN
        </h1>
        <div className="flex justify-center my-6">
          <div className="border-t w-1/4 border-2 border-gray-400"></div>
        </div>
        <p className="text-center md:text-md max-w-screen-xl mx-auto">
          Berkarya, Berbagi, Bergerak bersama Berdiri teguh sebagai pilar
          kepedulian sosial dan pembangunan berkelanjutan. Dengan komitmen untuk
          memberikan dampak positif bagi masyarakat dan lingkungan, Pertamina
          Foundation menjadi penyokong utama inovasi, pendidikan, dan
          kesejahteraan, membuka jalan menuju masa depan yang berkelanjutan dan
          lebih baik bagi seluruh komunitas. Dalam implementasinya, Pertamina
          Foundation mengusung program PFseries dan Carbon Project serta menjadi
          badan penyelenggara TK Patra dan Universitas Pertamina.
        </p>
        <div className="flex justify-center my-6">
          <div className="border-t w-1/4 border-2 border-gray-400"></div>
        </div>
      </div>

      <h2 className="text-3xl text-center bg-white text-black pb-8 font-bold">
        Our Programs
      </h2>
      <div style={{ backgroundImage: `url(${ImagesBg})` }}>
        <div className="md:flex justify-center items-center gap-4 md:py-10 py-4 md:px-20 px-6">
          <div className="bg-white text-black md:p-16 p-6 text-center mt-4">
            <i className="fa fa-globe text-6xl text-lime-600"></i>
            <h1>
              Kawasan yang sempat digarap oleh puluhan penambak liar ini mulai
              direstorasi tahun 1998. Perubahan kawasan dari hutan menjadi areal
              tambak ikan tidak hanya menghilangkan pepohonan namun juga merusak
              alam dan ekosistem mangrove. Berbagai kendala dihadapi untuk
              mengembalikan kawasan ini ke peruntukkannya semula.
            </h1>
          </div>
          <div className="bg-white text-black md:p-16 p-6 text-center mt-4">
            <i className="fa fa-tint text-6xl text-cyan-600"></i>
            <h1>
              Merupakan ekosistem lahan basah yang didominasi oleh pepopohonan
              mangrove. Kawasan konservasi sangat dibutuhkan di Jakarta, ibu
              kota Indonesia yang sangat kekurangan akan lahan hijau terbuka,
              memiliki tingkat polusi udara yang cukup tinggi serta mulai
              mengalami erosi dan abrasi garis pantai.
            </h1>
          </div>
          <div className="bg-white text-black md:p-16 p-6 text-center mt-4">
            <i className="fa fa-map text-6xl text-cyan-600"></i>
            <h1>
              Surga hijau seluas 99,82 hektar ini terletak di kelurahan Kamal
              Muara yang bersebelahan dengan kawasan elit Pantai Indah Kapuk di
              Jakarta Utara. Lokasinya membuat sangat mudah untuk dikunjungi
              baik melalui akses Tol dalam kota maupun Tol JORR atau dengan
              Transportasi Umum seperti Bis TransJakarta.
            </h1>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section id="about" className="py-16 bg-white text-black text-center">
        <h2 className="text-3xl font-bold mb-4">About Us</h2>
        <p className="text-center md:text-md max-w-screen-xl mx-auto">
          Berkarya, Berbagi, Bergerak bersama Berdiri teguh sebagai pilar
          kepedulian sosial dan pembangunan berkelanjutan. Dengan komitmen untuk
          memberikan dampak positif bagi masyarakat dan lingkungan, Pertamina
          Foundation menjadi penyokong utama inovasi, pendidikan, dan
          kesejahteraan, membuka jalan menuju masa depan yang berkelanjutan dan
          lebih baik bagi seluruh komunitas. Dalam implementasinya, Pertamina
          Foundation mengusung program PFseries dan Carbon Project serta menjadi
          badan penyelenggara TK Patra dan Universitas Pertamina.
        </p>
      </section>
      {/* Programs Section */}
      <div className="bg-gray-100/50 py-8">
        <BlogGrid />
      </div>
      <div className="w-full bg-white">
        <EventsSection />
      </div>
      {/* Contact Section */}
      <section id="contact" className="py-16 bg-white text-black text-center">
        <h2 className="text-3xl font-bold mb-4">Contact Us</h2>
        <p className="text-lg mb-4">Email: info@pertaminafoundation.org</p>
        <p className="text-lg mb-8">Phone: +62 123 456 789</p>
        <form className="max-w-md mx-auto space-y-4">
          <input
            type="text"
            placeholder="Your Name"
            className="w-full border bg-white border-gray-300 p-2 rounded"
          />
          <input
            type="email"
            placeholder="Your Email"
            className="w-full border bg-white border-gray-300 p-2 rounded"
          />
          <textarea
            placeholder="Your Message"
            className="w-full border bg-white border-gray-300 p-2 rounded"></textarea>
          <button
            type="submit"
            className="bg-teal-700 text-white px-6 py-2 rounded hover:bg-teal-600 w-full">
            Send Message
          </button>
        </form>
      </section>
      {/* Footer */}
      <footer className="bg-teal-700 text-white text-center py-4">
        <p>&copy; 2025 Pertamina Foundation. All rights reserved.</p>
      </footer>
    </div>
  );
};
