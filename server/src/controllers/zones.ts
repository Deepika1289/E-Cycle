import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Zone } from '../models/Zone.js';
import { Cycle } from '../models/Cycle.js';
import { validateZone } from '../validators/zone.js';

// Get all zones
export const getAllZones = async (req: Request, res: Response) => {
  try {
    const zones = await Zone.find().populate('manager', 'name email');
    res.status(200).json({ success: true, zones });
  } catch (error) {
    console.error('Error fetching zones:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch zones' });
  }
};

// Get zone by ID
export const getZoneById = async (req: Request, res: Response) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid zone ID format' });
    }
    
    const zone = await Zone.findById(req.params.id).populate('manager', 'name email');
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }
    return res.status(200).json({ success: true, zone });
  } catch (error) {
    console.error('Error fetching zone:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch zone' });
  }
};

// Create new zone
export const createZone = async (req: Request, res: Response) => {
  try {
    const { error } = validateZone(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const newZone = new Zone(req.body);
    await newZone.save();
    return res.status(201).json({ success: true, zone: newZone });
  } catch (error) {
    console.error('Error creating zone:', error);
    return res.status(500).json({ success: false, message: 'Failed to create zone' });
  }
};

// Update zone
export const updateZone = async (req: Request, res: Response) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid zone ID format' });
    }
    
    const { error } = validateZone(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error.details[0].message });
    }

    const updatedZone = await Zone.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updatedZone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }

    return res.status(200).json({ success: true, zone: updatedZone });
  } catch (error) {
    console.error('Error updating zone:', error);
    return res.status(500).json({ success: false, message: 'Failed to update zone' });
  }
};

// Delete zone
export const deleteZone = async (req: Request, res: Response) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid zone ID format' });
    }
    
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }

    // Check if there are cycles assigned to this zone
    const cyclesInZone = await Cycle.countDocuments({ zone: req.params.id });
    if (cyclesInZone > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete zone with assigned cycles. Please reassign cycles first.' 
      });
    }

    await Zone.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Zone deleted successfully' });
  } catch (error) {
    console.error('Error deleting zone:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete zone' });
  }
};

// Get cycles in a zone
export const getCyclesInZone = async (req: Request, res: Response) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid zone ID format' });
    }
    
    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }

    const cycles = await Cycle.find({ zone: req.params.id });
    return res.status(200).json({ success: true, cycles });
  } catch (error) {
    console.error('Error fetching cycles in zone:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch cycles in zone' });
  }
};

// Assign cycles to zone
export const assignCyclesToZone = async (req: Request, res: Response) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid zone ID format' });
    }
    
    const { cycleIds } = req.body;
    if (!cycleIds || !Array.isArray(cycleIds)) {
      return res.status(400).json({ success: false, message: 'Cycle IDs must be provided as an array' });
    }

    const zone = await Zone.findById(req.params.id);
    if (!zone) {
      return res.status(404).json({ success: false, message: 'Zone not found' });
    }

    // Update all cycles to be assigned to this zone
    const updateResult = await Cycle.updateMany(
      { _id: { $in: cycleIds } },
      { $set: { zone: req.params.id } }
    );

    return res.status(200).json({ 
      success: true, 
      message: `${updateResult.modifiedCount} cycles assigned to zone successfully` 
    });
  } catch (error) {
    console.error('Error assigning cycles to zone:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign cycles to zone' });
  }
};

// Remove cycles from zone
export const removeCyclesFromZone = async (req: Request, res: Response) => {
  try {
    // Validate that the ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid zone ID format' });
    }
    
    const { cycleIds } = req.body;
    if (!cycleIds || !Array.isArray(cycleIds)) {
      return res.status(400).json({ success: false, message: 'Cycle IDs must be provided as an array' });
    }

    // Update all specified cycles to remove zone assignment
    const updateResult = await Cycle.updateMany(
      { _id: { $in: cycleIds }, zone: req.params.id },
      { $unset: { zone: "" } }
    );

    return res.status(200).json({ 
      success: true, 
      message: `${updateResult.modifiedCount} cycles removed from zone successfully` 
    });
  } catch (error) {
    console.error('Error removing cycles from zone:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove cycles from zone' });
  }
};