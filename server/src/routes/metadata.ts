import { Router, Request, Response } from 'express';
import { getCityUuid, getMerchantUuid, getMerchantCities } from '../repositories/metadataRepository.js';

const router = Router();

// ============================================
// GET /api/metadata/city-uuid
// ============================================

router.get('/city-uuid', async (req: Request, res: Response) => {
    try {
        const { city, merchantId, type } = req.query;

        // Basic validation
        if (!city || typeof city !== 'string') {
            res.status(400).json({ error: 'Missing or invalid "city" parameter' });
            return;
        }

        if (!merchantId || typeof merchantId !== 'string') {
            res.status(400).json({ error: 'Missing or invalid "merchantId" parameter (must be short ID)' });
            return;
        }

        const validTypes = ['driver', 'customer'];
        const selectedType = (type && typeof type === 'string' && validTypes.includes(type))
            ? type as 'driver' | 'customer'
            : 'driver';

        const uuid = await getCityUuid(city, merchantId, selectedType);

        if (uuid) {
            res.json({ success: true, uuid });
        } else {
            // Not found is 404
            res.status(404).json({ success: false, error: 'City UUID not found' });
        }

    } catch (error) {
        console.error('Error in /city-uuid:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ============================================
// GET /api/metadata/merchant-cities
// ============================================

router.get('/merchant-cities', async (req: Request, res: Response) => {
    try {
        const { merchantId, type } = req.query;

        if (!merchantId || typeof merchantId !== 'string') {
            res.status(400).json({ error: 'Missing or invalid "merchantId" parameter' });
            return;
        }

        const validTypes = ['driver', 'customer'];
        const selectedType = (type && typeof type === 'string' && validTypes.includes(type))
            ? type as 'driver' | 'customer'
            : 'driver';

        const cities = await getMerchantCities(merchantId, selectedType);

        res.json({ success: true, cities });

    } catch (error) {
        console.error('Error in /merchant-cities:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// ============================================
// GET /api/metadata/merchant-uuid
// ============================================

router.get('/merchant-uuid', async (req: Request, res: Response) => {
    try {
        const { merchant, type } = req.query;

        if (!merchant || typeof merchant !== 'string') {
            res.status(400).json({ error: 'Missing or invalid "merchant" parameter' });
            return;
        }

        const validTypes = ['driver', 'customer'];
        const selectedType = (type && typeof type === 'string' && validTypes.includes(type))
            ? type as 'driver' | 'customer'
            : 'driver';

        const uuid = await getMerchantUuid(merchant, selectedType);

        if (uuid) {
            res.json({ success: true, uuid });
        } else {
            res.status(404).json({ success: false, error: 'Merchant UUID not found' });
        }

    } catch (error) {
        console.error('Error in /merchant-uuid:', error);
        res.status(500).json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
