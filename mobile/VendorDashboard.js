// === VendorDashboard.js ===
// A simple vendor web dashboard to view tickets within their radius and category

import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function VendorDashboard({ vendorLocation, radius, category }) {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.post('http://<YOUR_BACKEND_IP>:3000/vendor-tickets', {
          vendor_location: vendorLocation,
          radius,
          category
        });
        setTickets(res.data.tickets);
      } catch (err) {
        console.error('Error loading tickets', err);
      }
    };
    fetchTickets();
  }, [vendorLocation, radius, category]);

  return (
    <div style={{ padding: 20 }}>
      <h2>Jobs in your area ({category})</h2>
      {tickets.map((ticket, idx) => (
        <div key={idx} style={{ border: '1px solid #ccc', margin: '10px 0', padding: 10 }}>
          <p><strong>Summary:</strong> {ticket.assistant_reply}</p>
          <p><strong>Location:</strong> Lat {ticket.user_location.coordinates[1]}, Lon {ticket.user_location.coordinates[0]}</p>
          {ticket.image_url && (
            <img src={ticket.image_url} alt="ticket" style={{ maxWidth: '100%' }} />
          )}
          <form
            onSubmit={async e => {
              e.preventDefault();
              const quote = e.target.elements.quote.value;
              await axios.post('http://<YOUR_BACKEND_IP>:3000/submit-quote', {
                log_id: ticket.id,
                quote
              });
              alert('Quote submitted!');
            }}
          >
            <input type="number" name="quote" placeholder="Enter your quote" required />
            <button type="submit">Submit Quote</button>
          </form>
        </div>
      ))}
    </div>
  );
}
