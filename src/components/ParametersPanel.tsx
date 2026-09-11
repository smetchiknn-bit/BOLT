import { BoltParams, GOST_TABLE } from '../utils/boltGeometry';

interface ParametersPanelProps {
  params: BoltParams;
  onChange: (params: BoltParams) => void;
  showWireframe: boolean;
  onToggleWireframe: () => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
}

export default function ParametersPanel({
  params,
  onChange,
  showWireframe,
  onToggleWireframe,
  showDimensions,
  onToggleDimensions,
  autoRotate,
  onToggleAutoRotate,
}: ParametersPanelProps) {

  const handleChange = (key: keyof BoltParams, value: number) => {
    onChange({ ...params, [key]: value });
  };

  const handleGostSelect = (size: string) => {
    const gostParams = GOST_TABLE[size];
    if (gostParams) {
      onChange({ ...params, ...gostParams });
    }
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm border border-gray-700 rounded-xl p-5 space-y-5 overflow-y-auto max-h-full">
      {/* Заголовок */}
      <div className="border-b border-gray-700 pb-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span className="text-blue-400">⚙️</span> Параметры болта
        </h2>
        <p className="text-xs text-gray-400 mt-1">ГОСТ 7798-70 • Параметрическая модель</p>
      </div>

      {/* Выбор типоразмера */}
      <div>
        <label className="text-sm font-medium text-gray-300 block mb-2">
          Типоразмер (ГОСТ 7798-70)
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {Object.keys(GOST_TABLE).map((size) => (
            <button
              key={size}
              onClick={() => handleGostSelect(size)}
              className={`px-2 py-1.5 text-xs rounded-md font-medium transition-all ${
                params.D === GOST_TABLE[size]?.D
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      {/* Основные параметры */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-blue-400 uppercase tracking-wide">
          Основные размеры
        </h3>

        <ParamSlider
          label="D — Диаметр резьбы"
          value={params.D}
          min={6}
          max={24}
          step={1}
          unit="мм"
          onChange={(v) => handleChange('D', v)}
        />

        <ParamSlider
          label="L — Длина болта"
          value={params.L}
          min={20}
          max={120}
          step={5}
          unit="мм"
          onChange={(v) => handleChange('L', v)}
        />

        <ParamSlider
          label="L_рез — Длина резьбы"
          value={params.L_rez}
          min={10}
          max={params.L}
          step={1}
          unit="мм"
          onChange={(v) => handleChange('L_rez', v)}
        />
      </div>

      {/* Параметры головки */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-green-400 uppercase tracking-wide">
          Головка
        </h3>

        <ParamSlider
          label="S — Размер под ключ"
          value={params.S}
          min={8}
          max={41}
          step={1}
          unit="мм"
          onChange={(v) => handleChange('S', v)}
        />

        <ParamSlider
          label="H — Высота головки"
          value={params.H}
          min={3}
          max={20}
          step={0.1}
          unit="мм"
          onChange={(v) => handleChange('H', v)}
        />
      </div>

      {/* Параметры резьбы */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-orange-400 uppercase tracking-wide">
          Резьба и элементы
        </h3>

        <ParamSlider
          label="P — Шаг резьбы"
          value={params.P}
          min={0.5}
          max={4}
          step={0.05}
          unit="мм"
          onChange={(v) => handleChange('P', v)}
        />

        <ParamSlider
          label="R — Радиус скругления"
          value={params.R_fillet}
          min={0}
          max={3}
          step={0.1}
          unit="мм"
          onChange={(v) => handleChange('R_fillet', v)}
        />

        <ParamSlider
          label="Фаска на конце"
          value={params.chamfer}
          min={0}
          max={5}
          step={0.1}
          unit="мм"
          onChange={(v) => handleChange('chamfer', v)}
        />
      </div>

      {/* Переключатели отображения */}
      <div className="border-t border-gray-700 pt-4 space-y-2">
        <h3 className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-3">
          Отображение
        </h3>

        <ToggleButton
          active={showWireframe}
          onClick={onToggleWireframe}
          label="Каркас (wireframe)"
          icon="🔲"
        />
        <ToggleButton
          active={showDimensions}
          onClick={onToggleDimensions}
          label="Размерные линии"
          icon="📏"
        />
        <ToggleButton
          active={autoRotate}
          onClick={onToggleAutoRotate}
          label="Авто-вращение"
          icon="🔄"
        />
      </div>

      {/* Информация */}
      <div className="border-t border-gray-700 pt-4">
        <div className="bg-gray-800/50 rounded-lg p-3 space-y-1.5">
          <h4 className="text-xs font-semibold text-gray-400 uppercase">Спецификация</h4>
          <div className="grid grid-cols-2 gap-1 text-xs">
            <span className="text-gray-500">Обозначение:</span>
            <span className="text-white font-mono">Болт М{params.D}×{params.L}</span>
            <span className="text-gray-500">ГОСТ:</span>
            <span className="text-white font-mono">7798-70</span>
            <span className="text-gray-500">Класс точности:</span>
            <span className="text-white font-mono">В</span>
            <span className="text-gray-500">Материал:</span>
            <span className="text-white font-mono">Сталь 35</span>
            <span className="text-gray-500">Покрытие:</span>
            <span className="text-white font-mono">Цинковое</span>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}

function ParamSlider({ label, value, min, max, step, unit, onChange }: ParamSliderProps) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs text-gray-400">{label}</label>
        <span className="text-xs font-mono text-white bg-gray-800 px-2 py-0.5 rounded">
          {value} {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer
          [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
          [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-blue-500 [&::-webkit-slider-thumb]:shadow-lg
          [&::-webkit-slider-thumb]:shadow-blue-500/30 [&::-webkit-slider-thumb]:cursor-pointer"
      />
    </div>
  );
}

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  label: string;
  icon: string;
}

function ToggleButton({ active, onClick, label, icon }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
        active
          ? 'bg-blue-600/20 border border-blue-500/50 text-blue-300'
          : 'bg-gray-800 border border-gray-700 text-gray-400 hover:bg-gray-750 hover:text-gray-300'
      }`}
    >
      <span>{icon}</span>
      <span>{label}</span>
      <span className={`ml-auto w-2 h-2 rounded-full ${active ? 'bg-blue-400' : 'bg-gray-600'}`} />
    </button>
  );
}
