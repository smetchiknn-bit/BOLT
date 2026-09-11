import { useState } from 'react';
import BoltViewer from './components/BoltViewer';
import ParametersPanel from './components/ParametersPanel';
import { BoltParams, DEFAULT_PARAMS } from './utils/boltGeometry';

export default function App() {
  const [params, setParams] = useState<BoltParams>(DEFAULT_PARAMS);
  const [showWireframe, setShowWireframe] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [autoRotate, setAutoRotate] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center text-sm font-bold">
            🔩
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-tight">
              3D Модель болта — ГОСТ 7798-70
            </h1>
            <p className="text-xs text-gray-400">
              Параметрическая модель • М{params.D}×{params.L} • КОМПАС-3D совместимо
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
              showInfo
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            ℹ️ Инфо
          </button>
          <button
            onClick={() => {
              const data = JSON.stringify(params, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `bolt_M${params.D}x${params.L}_params.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="px-3 py-1.5 text-xs rounded-lg bg-green-700 text-green-200 hover:bg-green-600 transition-all"
          >
            💾 Экспорт параметров
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* 3D Viewer */}
        <div className="flex-1 relative">
          <BoltViewer
            params={params}
            showWireframe={showWireframe}
            showDimensions={showDimensions}
            autoRotate={autoRotate}
          />

          {/* Overlay controls */}
          <div className="absolute top-4 left-4 bg-gray-900/80 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-700">
            <p className="text-xs text-gray-400">
              🖱️ ЛКМ — вращение • Колесо — масштаб • ПКМ — перемещение
            </p>
          </div>

          {/* Info overlay */}
          {showInfo && (
            <div className="absolute bottom-4 left-4 right-4 bg-gray-900/95 backdrop-blur-sm rounded-xl p-5 border border-gray-700 max-w-2xl">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <span className="text-blue-400">📋</span>
                Информация о модели
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                <InfoItem label="Стандарт" value="ГОСТ 7798-70" />
                <InfoItem label="Тип" value="Болт с шестигранной головкой" />
                <InfoItem label="Класс точности" value="В (нормальный)" />
                <InfoItem label="Диаметр резьбы" value={`М${params.D}`} />
                <InfoItem label="Шаг резьбы" value={`${params.P} мм (крупный)`} />
                <InfoItem label="Длина стержня" value={`${params.L} мм`} />
                <InfoItem label="Длина резьбы" value={`${params.L_rez} мм`} />
                <InfoItem label="Размер под ключ" value={`${params.S} мм`} />
                <InfoItem label="Высота головки" value={`${params.H} мм`} />
                <InfoItem label="Скругление R" value={`${params.R_fillet} мм`} />
                <InfoItem label="Фаска" value={`${params.chamfer}×45°`} />
                <InfoItem label="Резьба" value="Полная (метрическая)" />
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <p className="text-xs text-gray-400">
                  <strong className="text-yellow-400">Примечание:</strong> Модель построена параметрически.
                  Все основные размеры вынесены в переменные: D (диаметр), L (длина болта),
                  L_rez (длина резьбы). Для экспорта в КОМПАС-3D используйте параметрический
                  скрипт или API kompas.Graph7 для создания .m3d файла.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Parameters sidebar */}
        <div className="w-80 xl:w-96 border-l border-gray-800 p-4 overflow-y-auto shrink-0 bg-gray-950/50">
          <ParametersPanel
            params={params}
            onChange={setParams}
            showWireframe={showWireframe}
            onToggleWireframe={() => setShowWireframe(!showWireframe)}
            showDimensions={showDimensions}
            onToggleDimensions={() => setShowDimensions(!showDimensions)}
            autoRotate={autoRotate}
            onToggleAutoRotate={() => setAutoRotate(!autoRotate)}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900/80 border-t border-gray-800 px-6 py-2 flex items-center justify-between shrink-0">
        <p className="text-xs text-gray-500">
          Параметрическая 3D-модель болта • Three.js • React
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>Масса ≈ {calculateMass(params).toFixed(1)} г</span>
          <span>•</span>
          <span>Объём ≈ {calculateVolume(params).toFixed(1)} см³</span>
        </div>
      </footer>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-800/50 rounded-md px-2.5 py-1.5">
      <div className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</div>
      <div className="text-white font-medium mt-0.5">{value}</div>
    </div>
  );
}

function calculateMass(params: BoltParams): number {
  const volume = calculateVolume(params);
  return volume * 7.85; // плотность стали ≈ 7.85 г/см³
}

function calculateVolume(params: BoltParams): number {
  const { D, L, S, H } = params;
  const r = D / 2 / 10; // в см
  const headArea = (3 * Math.sqrt(3) / 2) * (S / 2 / 10) ** 2;
  const headVolume = headArea * (H / 10);
  const shankVolume = Math.PI * r * r * (L / 10);
  return headVolume + shankVolume;
}
