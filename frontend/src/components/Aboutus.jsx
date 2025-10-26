import React from 'react';
import { Users, Target, Heart, Leaf, Mail, Phone, MapPin, Award, TrendingUp, Shield } from 'lucide-react';

const AboutUs = () => {
  const teamMembers = [
    {
      name: 'Aryan Kadam',
      role: 'Project Lead & Backend Developer',
      email: 'aksatara05@gmail.com',
      phone: '+91 85309 92376',
      image: '👨‍💻',
      bio: 'Leading the development of GreenTrace and building robust backend systems for seamless operations.',
      expertise: ['Backend Development', 'System Architecture', 'API Development']
    },
    {
      name: 'Pranav Pisal',
      role: 'Backend Developer & Database Specialist',
      email: 'pranavpisal005@gmail.com',
      phone: '+91 97664 29219',
      image: '👨‍💼',
      bio: 'Designing and managing database architecture to ensure seamless data operations and security.',
      expertise: ['Database Design', 'Backend Logic', 'Data Analytics']
    },
    {
      name: 'Nikhil Chavan',
      role: 'Frontend Developer & UI/UX Designer',
      email: 'nikhilchavan@example.com',
      phone: '+91 77570 47262',
      image: '👨‍🎨',
      bio: 'Crafting beautiful and intuitive user experiences that make farming accessible to everyone.',
      expertise: ['React Development', 'UI/UX Design', 'Responsive Design']
    }
  ];

  const values = [
    {
      icon: Leaf,
      title: 'Sustainability',
      description: 'Promoting eco-friendly farming practices and reducing carbon footprint in agriculture supply chains.'
    },
    {
      icon: Shield,
      title: 'Transparency',
      description: 'Building trust through complete traceability and honest communication between farmers and merchants.'
    },
    {
      icon: Heart,
      title: 'Empowerment',
      description: 'Empowering farmers with technology to reach wider markets and get fair prices for their produce.'
    },
    {
      icon: TrendingUp,
      title: 'Innovation',
      description: 'Leveraging cutting-edge technology to revolutionize traditional agricultural trading practices.'
    }
  ];

  const stats = [
    { value: '100%', label: 'Platform Ready' },
    { value: '3', label: 'Team Members' },
    { value: '2024', label: 'Launch Year' }
  ];

  const features = [
    'Direct Farmer-to-Merchant Connection',
    'Real-time Product Tracking',
    'Secure Payment Gateway',
    'Advanced Analytics Dashboard',
    'Mobile-Responsive Platform',
    '24/7 Customer Support'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-green-600 to-green-700 text-white py-20">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-6">
            <Leaf className="w-16 h-16 animate-bounce" />
          </div>
          <h1 className="text-5xl font-bold mb-6">About GreenTrace</h1>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed">
            Bridging the gap between farmers and merchants through technology, 
            creating a transparent and efficient agricultural marketplace for a sustainable future.
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-4xl font-bold text-green-600 mb-2">{stat.value}</p>
                <p className="text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">Our Story</h2>
              <div className="space-y-4 text-gray-700 leading-relaxed">
                <p>
                  GreenTrace was born from a simple observation: the agricultural supply chain needed modernization. 
                  Farmers struggled to find reliable buyers, while merchants found it challenging to source quality 
                  produce directly from farms.
                </p>
                <p>
                  As a team of passionate developers and agricultural enthusiasts, we set out to create a platform 
                  that would eliminate middlemen, ensure fair pricing, and bring transparency to every transaction. 
                  Our B.E. project evolved into a comprehensive solution to transform how agricultural trade happens in India.
                </p>
                <p>
                  Today, GreenTrace is ready for deployment with a complete feature set including farmer and merchant 
                  dashboards, admin analytics, product management, and secure transaction handling. We're excited to 
                  launch our platform and contribute to building a more sustainable and equitable agricultural ecosystem.
                </p>
              </div>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-2xl shadow-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-lg leading-relaxed mb-6">
                  To revolutionize agricultural trade by creating a transparent, efficient, and technology-driven 
                  marketplace that empowers farmers and enables merchants to access quality produce directly from 
                  the source.
                </p>
                <div className="flex items-center space-x-2 text-green-100">
                  <Target className="w-6 h-6" />
                  <span className="font-semibold">Building a sustainable future, one transaction at a time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div key={index} className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-shadow">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mb-4">
                  <value.icon className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center space-x-3 bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="bg-green-500 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold">✓</span>
                </div>
                <span className="text-gray-700 font-medium">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-gradient-to-b from-white to-green-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">The minds behind GreenTrace</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {teamMembers.map((member, index) => (
              <div key={index} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all transform hover:-translate-y-2">
                <div className="bg-gradient-to-br from-green-400 to-green-600 h-32 relative">
                  <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2">
                    <div className="bg-white rounded-full w-24 h-24 flex items-center justify-center text-5xl shadow-lg">
                      {member.image}
                    </div>
                  </div>
                </div>
                <div className="pt-16 pb-6 px-6 text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{member.name}</h3>
                  <p className="text-green-600 font-semibold mb-4">{member.role}</p>
                  <p className="text-gray-600 text-sm mb-6 leading-relaxed">{member.bio}</p>
                  
                  {/* Expertise Tags */}
                  <div className="flex flex-wrap justify-center gap-2 mb-6">
                    {member.expertise.map((skill, idx) => (
                      <span key={idx} className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                  
                  {/* Contact Info */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex items-center justify-center space-x-2 text-gray-700">
                      <Mail className="w-4 h-4 text-green-600" />
                      <a href={`mailto:${member.email}`} className="text-sm hover:text-green-600 transition-colors">
                        {member.email}
                      </a>
                    </div>
                    <div className="flex items-center justify-center space-x-2 text-gray-700">
                      <Phone className="w-4 h-4 text-green-600" />
                      <a href={`tel:${member.phone.replace(/\s/g, '')}`} className="text-sm hover:text-green-600 transition-colors">
                        {member.phone}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Get In Touch</h2>
          <p className="text-xl mb-8">
            Have questions or want to collaborate? We'd love to hear from you!
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <a 
              href="mailto:aksatara05@gmail.com" 
              className="bg-white text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors inline-flex items-center space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Email Us</span>
            </a>
            <a 
              href="tel:+918530992376" 
              className="bg-green-800 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-900 transition-colors inline-flex items-center space-x-2"
            >
              <Phone className="w-5 h-5" />
              <span>Call Us</span>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="w-8 h-8 text-green-500 mr-2" />
            <span className="text-2xl font-bold text-white">GreenTrace</span>
          </div>
          <p className="mb-4">Connecting Farmers & Merchants for a Sustainable Future</p>
          <p className="text-sm">
            © 2024 GreenTrace. A B.E. Project by Aryan Kadam, Pranav Pisal & Nikhil Chavan
          </p>
          <p className="text-xs mt-2">Made with 💚 in India</p>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;