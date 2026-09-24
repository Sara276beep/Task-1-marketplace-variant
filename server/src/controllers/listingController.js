import Joi from 'joi';
import { Listing } from '../models/Listing.js';

// TODO: write a validation schema for create/update per README.md section 2.
const listingFieldRules = {
  title: Joi.string().trim().min(1).max(120),
  description: Joi.string().trim().max(2000).allow(''),
  price: Joi.number().min(0),
  category: Joi.string().valid('textbooks', 'electronics', 'furniture', 'clothing', 'other'),
  condition: Joi.string().valid('new', 'like-new', 'used', 'worn'),
  status: Joi.string().valid('active', 'sold', 'removed'),
  seller: Joi.string().hex().length(24)
};

const createSchema = Joi.object({
  title: listingFieldRules.title.required(),
  description: listingFieldRules.description,
  price: listingFieldRules.price.required(),
  category: listingFieldRules.category,
  condition: listingFieldRules.condition,
  status: listingFieldRules.status,
  seller: listingFieldRules.seller
});

const updateSchema = Joi.object({
  title: listingFieldRules.title,
  description: listingFieldRules.description,
  price: listingFieldRules.price,
  category: listingFieldRules.category,
  condition: listingFieldRules.condition,
  status: listingFieldRules.status,
  seller: listingFieldRules.seller
}).min(1);

// GET /api/listings
// TODO: implement per README.md section 3.
export async function getAllListings(req, res, next) {
  try {
    const includeRemoved = req.query.includeRemoved === 'true';

    const filter = includeRemoved
      ? {}
      : { status: { $ne: 'removed' } };

    const listings = await Listing.find(filter)
      .populate('seller', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    res.json({ listings });
  } catch (err) {
    next(err);
  }
}

// GET /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function getListing(req, res, next) {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate('seller', 'name email');

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    const includeRemoved = req.query.includeRemoved === 'true';

    if (listing.status === 'removed' && !includeRemoved) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// POST /api/listings
// TODO: implement per README.md section 3.
export async function createListing(req, res, next) {
  try {
    const { value, error } = createSchema.validate(req.body);

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const listing = await Listing.create(value);

    res.status(201).json({ listing });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/listings/:id
// TODO: implement per README.md sections 3 and 5.
export async function updateListing(req, res, next) {
  try {
    const { value, error } = updateSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: value },
      { new: true, runValidators: true }
    );

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/listings/:id
// TODO: implement per README.md sections 4 and 5.
export async function deleteListing(req, res, next) {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { $set: { status: 'removed' } },
      { new: true, runValidators: true }
    );

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found' });
    }

    res.json({ listing });
  } catch (err) {
    next(err);
  }
}