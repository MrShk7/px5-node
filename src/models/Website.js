const { Schema, model, Types } = require('mongoose')

const heroSchema = new Schema(
  {
    title: { type: String, trim: true, default: 'Hi, I am' },
    subtitle: { type: String, trim: true, default: 'Daniel Rivers' },
    description: {
      type: String,
      trim: true,
      default:
        'Award-winning photographer specializing in timeless, documentary-style imagery.',
    },
    buttonLabel: { type: String, trim: true, default: 'Book Photoshoot Now' },
    image: {
      type: String,
      trim: true,
      default:
        'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80',
    },
  },
  { _id: false },
)

const brandStripSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    items: {
      type: [String],
      default: ['Photography', 'Cinematography', 'Branding', 'Commercial'],
    },
  },
  { _id: false },
)

const sectionSchema = new Schema(
  {
    title: { type: String, trim: true },
    subtitle: { type: String, trim: true },
  },
  { _id: false },
)

const testimonialSchema = new Schema(
  {
    quote: { type: String, trim: true },
    author: { type: String, trim: true },
    role: { type: String, trim: true },
  },
  { _id: false },
)

const contactSchema = new Schema(
  {
    email: { type: String, trim: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    note: { type: String, trim: true },
  },
  { _id: false },
)

const themeSchema = new Schema(
  {
    primary: { type: String, trim: true, default: '#1f2937' },
    accent: { type: String, trim: true, default: '#4c1d95' },
    background: { type: String, trim: true, default: '#f5efe6' },
    surface: { type: String, trim: true, default: '#ffffff' },
  },
  { _id: false },
)

const websiteSchema = new Schema(
  {
    owner: {
      type: Types.ObjectId,
      ref: 'User',
      unique: true,
      required: true,
    },
    hero: { type: heroSchema, default: () => ({}) },
    brandStrip: { type: brandStripSchema, default: () => ({}) },
    servicesSection: {
      type: sectionSchema,
      default: () => ({
        title: 'Services we provide',
        subtitle: 'Capture every precious moment with us.',
      }),
    },
    portfolioSection: {
      type: sectionSchema,
      default: () => ({
        title: 'My Portfolio',
        subtitle:
          'A curated collection of stories captured through an artistic lens.',
      }),
    },
    testimonialsSection: {
      type: sectionSchema,
      default: () => ({
        title: 'Happy & satisfied clients',
        subtitle:
          'Here is what some of my satisfied clients have to say about us.',
      }),
    },
    testimonials: {
      type: [testimonialSchema],
      default: () => [
        {
          quote:
            'Absolutely loved working with this team! They made the entire process easy and enjoyable.',
          author: 'Jane Cooper',
          role: 'Client',
        },
      ],
    },
    contactSection: {
      type: contactSchema,
      default: () => ({
        email: 'janecooper@gmail.com',
        phone: '+91 99999 88888',
        address: '302 Murphy Row, Near Walmart, 304565',
        note: 'Discover specialized service within each category.',
      }),
    },
    theme: { type: themeSchema, default: () => ({}) },
    seo: {
      headline: { type: String, trim: true },
      description: { type: String, trim: true },
    },
    lastPublishedAt: { type: Date },
  },
  {
    timestamps: true,
  },
)

module.exports = model('Website', websiteSchema)

