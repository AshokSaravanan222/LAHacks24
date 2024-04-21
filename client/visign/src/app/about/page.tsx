import Navbar from '@/components/Navbar'
import React from 'react'

const AboutUsPage = () => {
  return (
    <div>
      <Navbar />
      <div style={{ margin: '15px', textAlign: 'center' , color: 'white'}}>
        <h1>About Us</h1>
        <p>Welcome to ViSign, a place where we serve to bridge the communication gaps between the deaf and hearing communities. .</p>
        <section style={{ marginTop: '30px' }}>
          <h2>Our Mission</h2>
          <p>[Describe the mission of your organization, what you're passionate about, and what you aim to achieve.]</p>
        </section>
        <section>
          <h2>Our Team</h2>
          <p>Geoffrey, Wayne, Ashok, Vib</p>
        </section>
        <section>
          <h2>Contact Us</h2>
          <p>Feel free to reach out via email at EMAIL or follow us on our social media pages at ViSign</p>
        </section>
      </div>
    </div>
  );
}

// Exporting the component for use in other parts of your application
export default AboutUsPage;