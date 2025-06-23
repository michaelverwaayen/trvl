// === VendorDashboard.js ===
// A Supabase-connected vendor dashboard with quotes and metrics

import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function VendorDashboard({ vendorLocation, radius, category, vendorEmail }) {
  const [tickets, setTickets] = useState([]);
  const [submittedQuotes, setSubmittedQuotes] = useState({});

  useEffect(() => {
    const fetchTickets = async () => {
      const { data, error } = await supabase.rpc('get_tickets_within_radius', {
        lat: vendorLocation.lat,
        lon: vendorLocation.lon,
        radius_km: radius,
        category_filter: category
      });
      if (!error) setTickets(data);
    };

    const fetchQuotes = async () => {
      const { data } = await supabase
        .from('quotes')
        .select('*')
        .eq('vendor_email', vendorEmail);

      const quoteMap = {};
      data?.forEach(q => {
        quoteMap[q.log_id] = { quote: q.quote, availability: q.availability };
      });
      setSubmittedQuotes(quoteMap);
    };

    fetchTickets();
    fetchQuotes();
  }, [vendorLocation, radius, category, vendorEmail]);

  const handleSubmitQuote = async (logId, quote, availability) => {
    const { error } = await supabase.from('quotes').insert([
      { log_id: logId, quote, vendor_email: vendorEmail, availability }
    ]);
    if (!error) {
      setSubmittedQuotes(prev => ({ ...prev, [logId]: { quote, availability } }));
      alert('Quote submitted!');
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Jobs in your area ({category})</h2>
      {tickets.map((ticket, idx) => (
        <div key={idx} style={{ border: '1px solid #ccc', margin: '10px 0', padding: 10 }}>
          <p><strong>Summary:</strong> {ticket.assistant_reply}</p>
          <p><strong>Severity:</strong> {ticket.severity || 'medium'}</p>
          <p><strong>Deadline:</strong> {ticket.expires_at ? new Date(ticket.expires_at).toLocaleString() : 'N/A'}</p>
          <p><strong>Location:</strong> Lat {ticket.user_location.coordinates[1]}, Lon {ticket.user_location.coordinates[0]}</p>
          {ticket.image_url && <img src={ticket.image_url} alt="ticket" style={{ maxWidth: '100%' }} />}

          {submittedQuotes[ticket.id] ? (
            <>
              <p><strong>Your Quote:</strong> ${submittedQuotes[ticket.id].quote}</p>
              <p><strong>Your Availability:</strong> {new Date(submittedQuotes[ticket.id].availability).toLocaleString()}</p>
            </>
          ) : (
            <form
              onSubmit={e => {
                e.preventDefault();
                const quote = e.target.elements.quote.value;
                const availability = e.target.elements.availability.value;
                handleSubmitQuote(ticket.id, quote, availability);
              }}
            >
              <input type="number" name="quote" placeholder="Enter your quote" required />
              <input type="datetime-local" name="availability" required />
              <button type="submit">Submit Quote</button>
            </form>
          )}
        </div>
      ))}
    </div>
  );
}
