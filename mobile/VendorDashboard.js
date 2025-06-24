// === VendorDashboard.js ===
// A Supabase-connected vendor dashboard with quotes, metrics, and urgent dispatch

import React, { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import { OPENAI_API_KEY } from './config';
import { supabase } from './supabase';



export default function VendorDashboard({ vendorLocation, radius, category, vendorEmail }) {
  const [tickets, setTickets] = useState([]);
  const [submittedQuotes, setSubmittedQuotes] = useState({});
  const [acceptedTicketId, setAcceptedTicketId] = useState(null);
  const [urgentTicket, setUrgentTicket] = useState(null);

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
        quoteMap[q.log_id] = {
          quote: q.quote,
          availability: q.availability,
          status: q.status || 'submitted'
        };
      });
      setSubmittedQuotes(quoteMap);
    };

    fetchTickets();
    fetchQuotes();
  }, [vendorLocation, radius, category, vendorEmail]);

  const handleSubmitQuote = async (logId, quote, availability) => {
    const { error } = await supabase.from('quotes').insert([
      {
        log_id: logId,
        quote,
        vendor_email: vendorEmail,
        availability,
        status: 'submitted'
      }
    ]);
    if (!error) {
      setSubmittedQuotes(prev => ({
        ...prev,
        [logId]: { quote, availability, status: 'submitted' }
      }));
      alert('Quote submitted!');
    }
  };

  const fetchUrgentTicket = async () => {
    const { data } = await supabase.rpc('get_urgent_ticket', {
      lat: vendorLocation.lat,
      lon: vendorLocation.lon,
      category_filter: category
    });
    if (data) setUrgentTicket(data);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Jobs in your area ({category})</h2>

      {urgentTicket && (
        <div style={{ border: '2px solid red', padding: 10, marginBottom: 20 }}>
          <h3>🚨 Urgent Job (Priority Dispatch)</h3>
          <p><strong>Summary:</strong> {urgentTicket.assistant_reply}</p>
          <p><strong>Required Immediately</strong></p>
          <button onClick={() => alert('Marked as en route!')}>🚐 Accept Urgent Job</button>
        </div>
      )}

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
              <p><strong>Status:</strong> {submittedQuotes[ticket.id].status}</p>
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

      <button style={{ marginTop: 30 }} onClick={fetchUrgentTicket}>
        🔍 Check for Urgent Dispatch
      </button>
    </div>
  );
}
