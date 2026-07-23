import { useState, useContext } from 'react';
import { Div, Card, Title, Button, FormItem, Select, Input, Textarea, Text } from '@vkontakte/vkui';
import type { CreateRideInput } from '@local-blablacar/contracts';
import { DataContext } from '../../../context/dataContext';
import { CarSeatMap } from '../../../components/CarSeatMap';
import { SEATS } from '../../../utils/constants';

interface Props {
  onBack: () => void;
  onSubmit: (formData: CreateRideInput) => void;
  loading: boolean;
}

export function CreateRideForm({ onBack, onSubmit, loading }: Props) {
  const ctx = useContext(DataContext);
  const locations = ctx?.locations ?? [];
  const [form, setForm] = useState({
    fromId: '',
    toId: '',
    departureTime: '',
    offeredSeats: [2, 3, 4, 5],
    price: 0,
    driverNote: '',
  });

  const handleSubmit = () => {
    onSubmit({
      ...form,
      fromId: Number(form.fromId),
      toId: Number(form.toId),
      departureTime: new Date(form.departureTime).toISOString(),
    });
  };

  return (
    <Div>
      <Card mode="shadow">
        <Div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level="3">Новая поездка</Title>
            <Button size="s" mode="secondary" onClick={onBack}>Назад</Button>
          </div>

          <FormItem top="Откуда" required>
            <Select
              placeholder="Выберите точку отправления"
              value={form.fromId}
              onChange={(e) => setForm((f) => ({ ...f, fromId: e.target.value, toId: f.toId === e.target.value ? '' : f.toId }))}
              options={locations.filter((l) => l.id !== Number(form.toId)).map((l) => ({ label: l.name, value: String(l.id) }))}
            />
          </FormItem>

          <FormItem top="Куда" required>
            <Select
              placeholder={form.fromId ? "Выберите точку назначения" : "Сначала выберите отправление"}
              value={form.toId}
              onChange={(e) => setForm((f) => ({ ...f, toId: e.target.value }))}
              options={locations.filter((l) => l.id !== Number(form.fromId)).map((l) => ({ label: l.name, value: String(l.id) }))}
              disabled={!form.fromId}
            />
          </FormItem>

          <FormItem top="Дата и время">
            <Input
              type="datetime-local"
              value={form.departureTime}
              onChange={(e) => setForm((f) => ({ ...f, departureTime: e.target.value }))}
            />
          </FormItem>

          <FormItem top="Доступные места в автомобиле">
            <div style={{ marginBottom: 12 }}>
              <Text style={{ color: 'var(--vkui-color-text-secondary)', fontSize: 13, textAlign: 'center' }}>
                Выберите места, на которые готовы посадить пассажиров
              </Text>
            </div>
            <CarSeatMap
              seats={SEATS}
              selectedSeats={form.offeredSeats}
              occupiedSeats={[]}
              mode="create"
              onSelectSeat={(id) => setForm((f) => ({
                ...f,
                offeredSeats: f.offeredSeats.includes(id)
                  ? f.offeredSeats.filter((s) => s !== id)
                  : [...f.offeredSeats, id],
              }))}
            />
          </FormItem>

          <FormItem top="Условия и комментарий (необязательно)">
            <Textarea
              placeholder="Например: пустой багажник, можно с животными"
              value={form.driverNote}
              onChange={(e) => setForm((f) => ({ ...f, driverNote: e.target.value }))}
            />
          </FormItem>

          <FormItem top="Цена, ₽" required>
            <Input
              type="number"
              min={10}
              max={1000000}
              value={form.price || ''}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                setForm((f) => ({ ...f, price: isNaN(val) || val < 0 ? 0 : val }));
              }}
            />
          </FormItem>

          <Button
            size="l"
            stretched
            mode="primary"
            appearance="positive"
            onClick={handleSubmit}
            disabled={loading || form.offeredSeats.length === 0 || !form.fromId || !form.toId || !form.departureTime}
          >
            {loading ? 'Создание...' : 'Опубликовать'}
          </Button>
        </Div>
      </Card>
    </Div>
  );
}
