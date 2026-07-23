import { useContext } from 'react';
import { Div, Card, Title, FormItem, Select, Button } from '@vkontakte/vkui';
import { DataContext } from '../../../context/dataContext';

interface Props {
  fromId: string;
  toId: string;
  date: string;
  onFromIdChange: (id: string) => void;
  onToIdChange: (id: string) => void;
  onDateChange: (date: string) => void;
  onSearch: () => void;
  loading: boolean;
}

export function SearchForm({ fromId, toId, date, onFromIdChange, onToIdChange, onDateChange, onSearch, loading }: Props) {
  const ctx = useContext(DataContext);
  const locations = ctx?.locations ?? [];

  return (
    <Div>
      <Card mode="shadow">
        <Div>
          <Title level="3" style={{ marginBottom: 16 }}>Найти поездку</Title>

          <FormItem top="Откуда" required>
            <Select
              placeholder="Выберите точку отправления"
              value={fromId}
              onChange={(e) => onFromIdChange(e.target.value)}
              options={locations.filter((l) => l.id !== Number(toId)).map((l) => ({ label: l.name, value: String(l.id) }))}
            />
          </FormItem>

          <FormItem top="Куда" required>
            <Select
              placeholder={fromId ? "Выберите точку назначения" : "Сначала выберите отправление"}
              value={toId}
              onChange={(e) => onToIdChange(e.target.value)}
              options={locations.filter((l) => l.id !== Number(fromId)).map((l) => ({ label: l.name, value: String(l.id) }))}
              disabled={!fromId}
            />
          </FormItem>

          <FormItem top="Дата (необязательно)">
            <input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--vkui-color-separator)',
                background: 'var(--vkui-color-background-primary)',
                fontSize: '16px',
              }}
            />
          </FormItem>

          <Button
            size="l"
            stretched
            mode="primary"
            appearance="positive"
            onClick={onSearch}
            disabled={loading || !fromId || !toId}
          >
            {loading ? 'Поиск...' : 'Найти поездки'}
          </Button>
        </Div>
      </Card>
    </Div>
  );
}
