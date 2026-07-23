import { useEffect, useState, useRef } from 'react';
import {
  Panel as PanelType,
  PanelHeader,
  PanelHeaderBack,
  Button,
  Text,
  Title,
  Div,
  Spinner,
} from '@vkontakte/vkui';
import { useParams, useRouteNavigator } from '@vkontakte/vk-mini-apps-router';
import type { RideDTO, BookingDTO } from '@local-blablacar/contracts';
import { getRide } from '../api/rides';
import { createBooking, cancelBooking as cancelBookingApi, listMyBookings, updateBooking as updateBookingApi } from '../api/bookings';
import { TripCard } from '../components/TripCard';
import '../styles.css';

export function RideDetails(props: React.ComponentProps<typeof PanelType>) {
  const routeNavigator = useRouteNavigator();
  const params = useParams<'id'>();
  const [ride, setRide] = useState<RideDTO | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [myBookings, setMyBookings] = useState<BookingDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<number[]>([]);
  const [passengerNote, setPassengerNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const ignoreRef = useRef(false);

  useEffect(() => {
    if (!params?.id) return;
    ignoreRef.current = false;
    // Reset state on param change (H12, H19)
    setRide(null);
    setNotFound(false);
    setError(null);
    setSelectedSeats([]);
    setPassengerNote('');
    setIsEditing(false);

    const rideId = Number(params.id);
    if (Number.isNaN(rideId)) {
      setNotFound(true);
      return;
    }

    getRide(rideId)
      .then((data) => { if (!ignoreRef.current) setRide(data); })
      .catch(() => { if (!ignoreRef.current) setNotFound(true); });
    listMyBookings()
      .then((data) => { if (!ignoreRef.current) setMyBookings(data); })
      .catch(console.error);

    return () => { ignoreRef.current = true; };
  }, [params?.id]);

  function isBooked(rideId: number): boolean {
    return myBookings.some((b) => b.rideId === rideId);
  }

  function getBookingForRide(rideId: number): BookingDTO | undefined {
    return myBookings.find((b) => b.rideId === rideId);
  }

  async function handleBook() {
    if (!ride || selectedSeats.length === 0) return;
    if (!window.confirm(`Забронировать ${selectedSeats.length} мест(а)?`)) return;

    setLoading(true);
    setError(null);
    try {
      await createBooking({ rideId: ride.id, seatIds: selectedSeats, passengerNote: passengerNote || undefined });
      const updatedBookings = await listMyBookings();
      setMyBookings(updatedBookings);
      setSelectedSeats([]);
      setPassengerNote('');
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось забронировать';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    const booking = ride ? getBookingForRide(ride.id) : undefined;
    if (!booking) return;
    if (!window.confirm('Вы уверены, что хотите отменить бронирование?')) return;

    setLoading(true);
    setError(null);
    try {
      await cancelBookingApi(booking.id);
      const updatedBookings = await listMyBookings();
      setMyBookings(updatedBookings);
      setIsEditing(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось отменить';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleStartEdit() {
    const booking = ride ? getBookingForRide(ride.id) : undefined;
    if (booking) {
      setSelectedSeats(booking.seatIds);
      setPassengerNote(booking.passengerNote || '');
    }
    setIsEditing(true);
  }

  async function handleUpdate() {
    const booking = ride ? getBookingForRide(ride.id) : undefined;
    if (!booking || selectedSeats.length === 0) return;
    if (!window.confirm(`Избронировать ${selectedSeats.length} мест(а)?`)) return;

    setLoading(true);
    setError(null);
    try {
      await updateBookingApi(booking.id, { seatIds: selectedSeats, passengerNote: passengerNote || undefined });
      const updatedBookings = await listMyBookings();
      setMyBookings(updatedBookings);
      setIsEditing(false);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Не удалось изменить бронирование';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const booked = ride ? isBooked(ride.id) : false;
  const currentBooking = ride ? getBookingForRide(ride.id) : undefined;

  return (
    <PanelType {...props}>
      <PanelHeader before={<PanelHeaderBack onClick={() => routeNavigator.push('/passenger')} />}>
        Детали поездки
      </PanelHeader>

      {error && (
        <Div>
          <div style={{ padding: 12, background: 'var(--vkui-color-background-negative)', borderRadius: 8 }}>
            <Text style={{ color: 'white' }}>{error}</Text>
            <Button
              size="s"
              mode="secondary"
              onClick={() => setError(null)}
              style={{ marginTop: 8 }}
            >
              Закрыть
            </Button>
          </div>
        </Div>
      )}

      {!ride && !notFound && (
        <Div style={{ textAlign: 'center', padding: 40 }}>
          <Spinner />
        </Div>
      )}

      {notFound && (
        <Div style={{ textAlign: 'center', padding: 40 }}>
          <Title level="3" style={{ marginBottom: 8 }}>
            Поездка не найдена
          </Title>
          <Text style={{ color: 'var(--vkui-color-text-secondary)' }}>
            Возможно, она уже завершена
          </Text>
        </Div>
      )}

      {ride && (
        <Div>
          <TripCard
            ride={ride}
            bookings={ride.bookings}
            selectedSeats={selectedSeats}
            passengerNote={passengerNote}
            onPassengerNoteChange={setPassengerNote}
            onSelectSeat={(seatId) => {
              setSelectedSeats((prev) =>
                prev.includes(seatId)
                  ? prev.filter((s) => s !== seatId)
                  : [...prev, seatId]
              );
            }}
            onBook={handleBook}
            onUpdate={handleUpdate}
            onCancel={isEditing ? () => setIsEditing(false) : handleCancel}
            mode="passenger"
            isBooked={booked}
            bookingStatus={currentBooking?.status}
            isEditing={isEditing}
            onStartEdit={handleStartEdit}
          />
        </Div>
      )}
    </PanelType>
  );
}
