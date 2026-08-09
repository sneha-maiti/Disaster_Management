require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

// In-memory data store for SOS requests (Sample entries in Kolkata)
const sosRequests = [
    {
        id: 1,
        name: "Aarav Sharma",
        phone: "+91 98300 12345",
        latitude: 22.5539,
        longitude: 88.3518,
        message: "Trapped on roof of 2-story building due to rising flood waters in Park Street, need immediate rescue",
        urgency: "HIGH",
        category: "Trapped",
        createdAt: "2026-08-09T10:00:00.000Z"
    },
    {
        id: 2,
        name: "Priya Mukherjee",
        phone: "+91 98311 23456",
        latitude: 22.5804,
        longitude: 88.4378,
        message: "Elderly person injured leg and needs medical attention in Salt Lake Sector 5",
        urgency: "HIGH",
        category: "Medical",
        createdAt: "2026-08-09T10:30:00.000Z"
    },
    {
        id: 3,
        name: "Rahul Das",
        phone: "+91 98322 34567",
        latitude: 22.5851,
        longitude: 88.3412,
        message: "Urgent need of clean drinking water and food packets for 5 people near Howrah Station",
        urgency: "MEDIUM",
        category: "Food/Water",
        createdAt: "2026-08-09T11:00:00.000Z"
    }
];

// Sample Emergency Shelters in Kolkata
const shelters = [
    {
        id: 1,
        name: "Salt Lake Community Relief Center",
        latitude: 22.5867,
        longitude: 88.4172,
        available_beds: 45
    },
    {
        id: 2,
        name: "Howrah Emergency Flood Shelter",
        latitude: 22.5900,
        longitude: 88.3300,
        available_beds: 80
    },
    {
        id: 3,
        name: "Park Circus Indoor Stadium Shelter",
        latitude: 22.5448,
        longitude: 88.3675,
        available_beds: 30
    }
];

/**
 * Helper logic to determine Urgency ('HIGH', 'MEDIUM', 'LOW')
 * and Category ('Medical', 'Flooding', 'Trapped', 'Food/Water', 'General')
 */
function determineUrgencyAndCategory(message = "") {
    const text = message.toLowerCase();

    // Category Logic
    let category = "General";
    if (text.includes("trapped") || text.includes("stuck") || text.includes("rescue")) {
        category = "Trapped";
    } else if (text.includes("injured") || text.includes("medical") || text.includes("doctor") || text.includes("bleeding") || text.includes("sick")) {
        category = "Medical";
    } else if (text.includes("food") || text.includes("drinking water") || text.includes("water packets") || text.includes("ration")) {
        category = "Food/Water";
    } else if (text.includes("water") || text.includes("flood") || text.includes("flooding") || text.includes("submerged")) {
        category = "Flooding";
    }

    // Urgency Logic
    let urgency = "LOW";
    const highKeywords = ["trapped", "injured", "bleeding", "unconscious", "fire", "rescue", "drowning", "critical", "emergency", "stuck"];
    const mediumKeywords = ["water", "food", "flooding", "flood", "shelter", "electricity", "medicine", "supplies"];

    if (highKeywords.some(keyword => text.includes(keyword))) {
        urgency = "HIGH";
    } else if (mediumKeywords.some(keyword => text.includes(keyword))) {
        urgency = "MEDIUM";
    }

    return { urgency, category };
}

// GET / - Root route
app.get("/", (req, res) => {
    res.json({
        status: "OK",
        message: "Disaster Management Backend Server is running!"
    });
});

// GET /health - Health check route
app.get("/health", (req, res) => {
    res.json({
        status: "UP",
        timestamp: new Date().toISOString()
    });
});

// GET /api/sos - Returns sample SOS data array with Kolkata coordinates, messages, and urgency levels
app.get("/api/sos", (req, res) => {
    const urgencyWeight = { HIGH: 1, MEDIUM: 2, LOW: 3 };

    const sortedRequests = [...sosRequests].sort((a, b) => {
        return (urgencyWeight[a.urgency] || 4) - (urgencyWeight[b.urgency] || 4);
    });

    res.json(sortedRequests);
});

// POST /api/sos - Adds new SOS request
app.post("/api/sos", (req, res) => {
    const { name, phone, latitude, longitude, message } = req.body;

    if (!name || latitude === undefined || longitude === undefined || !message) {
        return res.status(400).json({
            error: "Missing required fields: name, latitude, longitude, and message are required."
        });
    }

    const { urgency, category } = determineUrgencyAndCategory(message);

    const newRequest = {
        id: sosRequests.length > 0 ? Math.max(...sosRequests.map(r => r.id)) + 1 : 1,
        name,
        phone: phone || "",
        latitude: Number(latitude),
        longitude: Number(longitude),
        message,
        urgency,
        category,
        createdAt: new Date().toISOString()
    };

    sosRequests.push(newRequest);

    return res.status(201).json({
        message: "SOS request recorded successfully",
        data: newRequest
    });
});

// GET /api/shelters - Returns sample shelters array
app.get("/api/shelters", (req, res) => {
    res.json(shelters);
});

const PORT = process.env.PORT || 5001;

if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
    });
}

module.exports = app;