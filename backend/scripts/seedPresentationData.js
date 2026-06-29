import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "../config/env.js";

import User from "../models/User.js";
import Product from "../models/Product.js";
import Equipment from "../models/Equipment.js";

const MONGO_URI = process.env.MONGODB_URL || process.env.MONGODB_URL_DIRECT;

const farmersData = [
  { fullName: "Aarav Patil", village: "Shivapur", district: "Pune", state: "Maharashtra", cropsGrown: "Tomato, Onion", landSize: "4 acres" },
  { fullName: "Riya Kulkarni", village: "Karad", district: "Satara", state: "Maharashtra", cropsGrown: "Sugarcane", landSize: "6 acres" },
  { fullName: "Karan Reddy", village: "Nalgonda", district: "Nalgonda", state: "Telangana", cropsGrown: "Chilli, Cotton", landSize: "5 acres" },
  { fullName: "Meera Gowda", village: "Mandya", district: "Mandya", state: "Karnataka", cropsGrown: "Paddy", landSize: "3 acres" },
  { fullName: "Ishaan Singh", village: "Moga", district: "Moga", state: "Punjab", cropsGrown: "Wheat", landSize: "7 acres" },
  { fullName: "Ananya Verma", village: "Hardoi", district: "Hardoi", state: "Uttar Pradesh", cropsGrown: "Potato", landSize: "4.5 acres" },
  { fullName: "Dev Sharma", village: "Kota", district: "Kota", state: "Rajasthan", cropsGrown: "Mustard", landSize: "8 acres" },
  { fullName: "Priya Das", village: "Krishnanagar", district: "Nadia", state: "West Bengal", cropsGrown: "Jute, Rice", landSize: "3.2 acres" },
  { fullName: "Rohan Naik", village: "Mapusa", district: "North Goa", state: "Goa", cropsGrown: "Coconut", landSize: "2 acres" },
  { fullName: "Sana Khan", village: "Sehore", district: "Sehore", state: "Madhya Pradesh", cropsGrown: "Soybean", landSize: "5.8 acres" },
];

const productTemplates = [
  { productName: "Fresh Tomatoes", category: "Vegetables", quantity: 700, unit: "kg", price: 24, qualityGrade: "Grade A", description: "Farm-fresh red tomatoes harvested this week.", image: "https://images.unsplash.com/photo-1561136594-7f68413baa99?auto=format&fit=crop&w=1200&q=80" },
  { productName: "Premium Sugarcane", category: "Others", quantity: 25, unit: "ton", price: 3000, qualityGrade: "Premium", description: "High recovery sugarcane, ready for bulk purchase.", image: "https://images.unsplash.com/photo-1592841200221-a6898f307baa?auto=format&fit=crop&w=1200&q=80" },
  { productName: "Dry Red Chilli", category: "Spices", quantity: 420, unit: "kg", price: 180, qualityGrade: "Grade A", description: "Sun-dried red chilli with good color and pungency.", image: "https://images.unsplash.com/photo-1583663848850-46af132dc08e?auto=format&fit=crop&w=1200&q=80" },
  { productName: "Paddy Rice", category: "Grains", quantity: 18, unit: "quintal", price: 2350, qualityGrade: "Standard", description: "Clean paddy grain, suitable for mill procurement.", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1200&q=80" },
  { productName: "Sharbati Wheat", category: "Grains", quantity: 30, unit: "quintal", price: 2950, qualityGrade: "Premium", description: "Bold grains with low moisture content.", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=1200&q=80" },
  { productName: "Table Potatoes", category: "Vegetables", quantity: 1200, unit: "kg", price: 19, qualityGrade: "Grade B", description: "Medium-size potatoes for retail and wholesale.", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=1200&q=80" },
  { productName: "Yellow Mustard", category: "Pulses", quantity: 14, unit: "quintal", price: 6200, qualityGrade: "Grade A", description: "Well-cleaned mustard with good oil yield.", image: "https://images.unsplash.com/photo-1615485925873-6bd21fe2ef36?auto=format&fit=crop&w=1200&q=80" },
  { productName: "Raw Jute Fiber", category: "Others", quantity: 900, unit: "kg", price: 55, qualityGrade: "Standard", description: "Processed raw jute bundles for industrial use.", image: "https://images.unsplash.com/photo-1471193945509-9ad0617afabf?auto=format&fit=crop&w=1200&q=80" },
  { productName: "Tender Coconuts", category: "Fruits", quantity: 1800, unit: "pieces", price: 28, qualityGrade: "Grade A", description: "Green tender coconuts, medium to large size.", image: "https://images.unsplash.com/photo-1581375321224-79da6fd32f6c?auto=format&fit=crop&w=1200&q=80" },
  { productName: "Fresh Onions", category: "Vegetables", quantity: 950, unit: "kg", price: 22, qualityGrade: "Grade A", description: "Sorted red onions with uniform size and low moisture.", image: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=1200&q=80" },
];

const equipmentTemplates = [
  { name: "John Deere 5310 Tractor", category: "Tractor", pricePerDay: 3500, description: "50 HP tractor suitable for ploughing and haulage.", brand: "John Deere", model: "5310", year: 2021, condition: "Excellent", image: "https://images.pexels.com/photos/1592982537447/pexels-photo-1592982537447.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { name: "Power Tiller (Rotavator)", category: "Tools", pricePerDay: 900, description: "Compact rotavator/tiller setup for small and medium farms.", brand: "VST", model: "Shakti 135", year: 2020, condition: "Good", image: "https://images.pexels.com/photos/1500595046743/pexels-photo-1500595046743.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { name: "Paddy Transplanter", category: "Seeder", pricePerDay: 2200, description: "Efficient paddy transplantation machine.", brand: "Kubota", model: "NSPU-68C", year: 2022, condition: "Excellent", image: "https://images.pexels.com/photos/24786224/pexels-photo-24786224.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { name: "Boom Sprayer", category: "Sprayer", pricePerDay: 1300, description: "Uniform spray coverage for crop protection.", brand: "Mahindra", model: "BoomPro", year: 2021, condition: "Good", image: "https://images.pexels.com/photos/1464226184884/pexels-photo-1464226184884.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { name: "Multi-crop Harvester", category: "Harvester", pricePerDay: 7800, description: "Self-propelled harvester for wheat and paddy.", brand: "Preet", model: "987", year: 2019, condition: "Good", image: "https://images.pexels.com/photos/13239503/pexels-photo-13239503.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { name: "Disc Plough", category: "Plough", pricePerDay: 850, description: "Heavy-duty disc plough for deep tillage.", brand: "Sonalika", model: "DP-4", year: 2020, condition: "Good", image: "https://images.pexels.com/photos/1625246333195/pexels-photo-1625246333195.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { name: "Seed Drill", category: "Seeder", pricePerDay: 1100, description: "Precision seed drill for even sowing.", brand: "Landforce", model: "SD-11", year: 2023, condition: "Excellent", image: "https://images.pexels.com/photos/17778148/pexels-photo-17778148.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { name: "Threshing Machine", category: "Thresher", pricePerDay: 2400, description: "Fast threshing with minimal grain loss.", brand: "FieldKing", model: "TFM-09", year: 2021, condition: "Good", image: "https://images.pexels.com/photos/17075355/pexels-photo-17075355.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { name: "Drip Irrigation Kit", category: "Irrigation", pricePerDay: 700, description: "Portable drip setup for efficient irrigation.", brand: "Jain", model: "DripFlex", year: 2022, condition: "Excellent", image: "https://images.pexels.com/photos/1589923188937/pexels-photo-1589923188937.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  { name: "Mini Cargo Farm Transport", category: "Transport", pricePerDay: 1600, description: "Compact transport vehicle for farm produce.", brand: "Mahindra", model: "Jeeto", year: 2020, condition: "Fair", image: "https://images.pexels.com/photos/1580674285054/pexels-photo-1580674285054.jpeg?auto=compress&cs=tinysrgb&w=1200" },
];

const run = async () => {
  if (!MONGO_URI) {
    throw new Error("Missing MONGODB_URL or MONGODB_URL_DIRECT in backend environment.");
  }

  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000, family: 4 });
  console.log("Connected to MongoDB");

  const hashedPassword = await bcrypt.hash("Demo@12345", 10);
  const emails = farmersData.map((_, idx) => `demo.farmer${idx + 1}@greentrace.demo`);

  await Product.deleteMany({ farmerName: { $in: farmersData.map((f) => f.fullName) } });
  await Equipment.deleteMany({ ownerName: { $in: farmersData.map((f) => f.fullName) } });
  await User.deleteMany({ email: { $in: emails } });

  const createdFarmers = [];
  for (let i = 0; i < farmersData.length; i += 1) {
    const farmer = farmersData[i];
    const user = await User.create({
      fullName: farmer.fullName,
      email: emails[i],
      password: hashedPassword,
      phoneNumber: `90000000${String(i).padStart(2, "0")}`,
      role: "farmer",
      village: farmer.village,
      district: farmer.district,
      state: farmer.state,
      cropsGrown: farmer.cropsGrown,
      landSize: farmer.landSize,
      isVerified: true,
      upiId: `farmer${i + 1}@upi`,
    });
    createdFarmers.push(user);
  }

  const now = new Date();
  const products = createdFarmers.map((farmer, i) => ({
    ...productTemplates[i],
    images: [productTemplates[i].image],
    farmerId: farmer._id,
    farmerName: farmer.fullName,
    farmerLocation: {
      village: farmer.village,
      district: farmer.district,
      state: farmer.state,
    },
    status: "listed",
    harvestDate: new Date(now.getTime() - (i + 2) * 86400000),
    expiryDate: new Date(now.getTime() + (20 + i) * 86400000),
    views: 10 + i * 3,
    inquiries: i % 4,
  }));

  const equipment = createdFarmers.map((farmer, i) => ({
    ...equipmentTemplates[i],
    images: [equipmentTemplates[i].image],
    location: {
      village: farmer.village,
      district: farmer.district,
      state: farmer.state,
    },
    availabilityStart: new Date(now.getTime() - 2 * 86400000),
    availabilityEnd: new Date(now.getTime() + 60 * 86400000),
    ownerId: farmer._id,
    ownerName: farmer.fullName,
    ownerPhone: farmer.phoneNumber,
    status: "available",
    totalBookings: i % 3,
    views: 15 + i * 2,
    averageRating: 4 + (i % 2) * 0.4,
    totalReviews: 2 + (i % 5),
    specifications: {
      brand: equipmentTemplates[i].brand,
      model: equipmentTemplates[i].model,
      year: equipmentTemplates[i].year,
      condition: equipmentTemplates[i].condition,
    },
  }));

  await Product.insertMany(products);
  await Equipment.insertMany(equipment);

  console.log("Seed complete");
  console.log(`Farmers: ${createdFarmers.length}`);
  console.log(`Products: ${products.length}`);
  console.log(`Equipment: ${equipment.length}`);
  console.log("Demo login password for seeded farmers: Demo@12345");
};

run()
  .then(async () => {
    await mongoose.connection.close();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Seeding failed:", error.message);
    await mongoose.connection.close();
    process.exit(1);
  });
