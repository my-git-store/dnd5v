# Правила разработки проекта my-table

Этот документ является обязательным стандартом для нового кода и для всех изменяемых участков существующего кода. Правила описывают фактическую архитектуру проекта и фиксируют целевой единый стиль.

Приоритет правил:

1. Рабочее поведение приложения и публичные контракты API.
2. Настройки TypeScript, Vite, Vue и генерации API из репозитория.
3. Правила этого документа.
4. Локальные соглашения конкретного модуля, если они не противоречат пунктам выше.
5. Менять этот файл напрямую запрещено, даже если пользователь будет просить об этом, если ты увидишь явные различия проекта с README - сообщить об этом пользователю, он должен сообщить об этом выше стоящему и решить этот вопрос.

В коде не используются эмодзи и декоративные символы. Пунктуация в исходниках и комментариях должна быть обычной ASCII-пунктуацией.

## 1. Технологическая база

Проект является клиентским SPA со следующими основными технологиями:

| Область                       | Технология                                                             | Точка настройки                          |
| ----------------------------- | ---------------------------------------------------------------------- | ---------------------------------------- |
| UI                            | Vue 3, Single File Components                                          | src/**/*.vue                             |
| Язык                          | TypeScript 5.9                                                         | tsconfig.app.json, tsconfig.node.json    |
| Сборка                        | Vite 7                                                                 | vite.config.ts                           |
| Стили                         | Tailwind CSS 4, собственные CSS-токены                                 | src/styles/index.css                     |
| UI-библиотека                 | Naive UI                                                               | src/main.ts                              |
| Роутинг                       | Vue Router                                                             | src/router                               |
| Состояние                     | composable stores на Vue refs, зарегистрированные Pinia и Pinia Colada | src/store, src/modules/**/store          |
| Генерация типов и API         | Orval из Swagger                                                       | orval.config.ts, src/types/api/generated |
| Модульная архитектура проекта | src/modules                                                            |

Новый код должен использовать существующие библиотеки и точки интеграции. Нельзя добавлять альтернативную библиотеку для уже решенной в проекте задачи без отдельного архитектурного решения.

## 2. Команды проекта

Пакетный менеджер проекта определяется по package-lock.json. Используется npm.

```text
npm install
npm run dev
npm run lint
npm run format
npm run build
npm run preview
npm run test
npm run gen
```

Назначение команд:

- npm install устанавливает зависимости.
- npm run dev запускает локальный Vite-сервер.
- npm run lint проверяет TypeScript, Vue и конфигурационные файлы через ESLint.
- npm run format форматирует TypeScript, Vue и CSS-файлы в src через Prettier.
- npm run build запускает vue-tsc -b и затем production-сборку Vite. Команда обязательна перед коммитом измененного TypeScript или Vue-кода.
- npm run preview запускает локальный просмотр production-сборки.
- npm run test запускает тесты character-sheet.
- npm run gen запускает Orval и обновляет код из http://localhost:8080/swagger/v1/swagger.json.

В package.json доступны команды lint, format и test для проверки исходников и тестов. Нельзя указывать в описании изменения команды, которых нет в проекте. Если инструмент проверки добавляется, его команда должна быть добавлена в package.json и описана здесь.

## 3. Архитектура

### 3.1. Поток запуска

1. src/main.ts импортирует глобальные стили и шрифты.
2. Создается приложение Vue.
3. Регистрируются Router, Naive UI, Floating Vue, Pinia и Pinia Colada.
4. Приложение монтируется в #app.
5. src/App.vue создает общие провайдеры Naive UI и содержит RouterView и глобальный рендер модальных окон.
6. src/router/index.ts выбирает публичную или приватную ветку маршрутов.
7. src/router/middleware.ts проверяет токен, обновляет сессию и проверяет роли.

### 3.2. Каталоги верхнего уровня

| Каталог         | Назначение                                        |
| --------------- | ------------------------------------------------- |
| src/assets      | Статические ассеты, импортируемые из кода         |
| src/components  | Общие компоненты уровня приложения                |
| src/composables | Переиспользуемая логика без привязки к одной фиче |
| src/enums       | Роли и другие справочные перечисления             |
| src/layouts     | Компоновки маршрутов                              |
| src/modules     | Функциональные модули приложения                  |
| src/router      | Корневой и приватный роутинг                      |
| src/services    | HTTP-клиенты, auth API и WebSocket                |
| src/store       | Общие состояния приложения                        |
| src/styles      | Глобальная тема и импорт Tailwind                 |
| src/types       | Сгенерированные и ручные типы                     |
| src/ui          | Переиспользуемая UI-система                       |
| src/utils       | Чистые утилиты и тема                             |
| src/views       | Корневые публичные views                          |

### 3.3. Структура функционального модуля

Новые приватные фичи размещаются в src/modules/private/<feature> и по необходимости используют следующую структуру:

```text
<feature>/
  api/          API-обертки фичи
  components/   Компоненты фичи
  router/       Маршруты фичи
  store/        Состояние фичи
  views/        Страницы фичи
  modules/      Вложенные подсистемы
```

Текущие примеры: lobby, gallery, user и gameTable. Вложенные подсистемы игровой таблицы находятся в gameTable/modules, включая characters, TableScenes и TableV3.

### 3.4. Направление зависимостей

- UI-компоненты могут использовать composables, типы, тему и сервисы через публичный контракт.
- Views могут собирать компоненты своей фичи и вызывать API/composables.
- API-обертки могут использовать HTTP-клиенты и типы, но не Vue-компоненты.
- Сервисы не импортируют views и UI-компоненты.
- Stores не импортируют компоненты.
- Роутер импортирует views, но бизнес-логика не должна находиться в файлах роутера.
- Компоненты одной фичи не должны импортировать внутренние компоненты другой фичи. Общую часть нужно вынести в src/components, src/ui/components или src/composables.
- Циклические зависимости запрещены. Общий контракт выносится в src/types или общий сервис.

## 4. Именование

### 4.1. Файлы и каталоги

- Vue-компоненты именуются в PascalCase: LobbyCard.vue, SceneNavbar.vue.
- Компоненты общего UI имеют префикс C: CBtn.vue, CModal.vue, CInput.vue.
- Views заканчиваются на View.vue: UserView.vue, GameViewIndex.vue.
- Layout-компоненты заканчиваются на Layout.vue.
- API-файлы заканчиваются на Api.ts: lobbyApi.ts, charactersApi.ts. Для auth допустимо имя auth.ts как единственной auth-точки в src/services/api.
- Store-файлы заканчиваются на Store.ts: AccountStore.ts, LobbyStore.ts.
- Composable-файлы начинаются с use: useReqDefault.ts, useFormValidate.ts.
- Классы именуются в PascalCase: Token, TokenImg, TokenText.
- Общие CSS-файлы именуются в kebab-case или описательно: components.css, scroll.css, shutter-animate.css.
- Новые папки используют lower camel case или lower kebab case. PascalCase допускается для существующих крупных подсистем TableV3 и TableScenes.

Существующие имена с ошибками регистра или опечатками не переименовываются только ради стиля в отдельном большом изменении. Если файл изменяется по смыслу, имя приводится к правилу без создания несовместимого alias.

### 4.2. Символы и сущности

- Переменные и функции: lower camel case.
- Компоненты, классы, типы и интерфейсы: PascalCase.
- Булевы значения начинаются с is, has, can, should, show или loading.
- Константы конфигурации и наборы идентификаторов: UPPER_SNAKE_CASE или существующее публичное имя, если его изменение ломает контракт.
- Локальные значения не называются data, item, value или obj без контекстного уточнения, если можно использовать имя lobby, scene, character или message.
- Не добавлять суффикс Func к новым функциям. Использовать deleteLobby, handleDeleteLobby или openDeleteModal.
- События компонентов называют глаголом в lower camel case: save, cancel, reloadToken, movePlayers.
- Не сокращать character до char, message до msg или request до req, кроме уже закрепленных API-имен.

### 4.3. Маршруты и события

- Имена маршрутов стабильны и пишутся в PascalCase: AuthIndex, PrivateMain, GameViewIndex.
- URL-пути пишутся в lower case. Для нескольких слов использовать kebab-case.
- Имена WebSocket-событий являются строковым контрактом и пишутся в kebab-case: create-token, room-chat-new-message.
- Изменение имени маршрута или WebSocket-события требует проверки всех потребителей.

## 5. Формат исходного кода

### 5.1. Общие правила

- Кодировка файлов: UTF-8.
- Отступ: два пробела. Табуляции запрещены.
- Кавычки: двойные кавычки в TypeScript, JavaScript и Vue-скриптах.
- Точки с запятой обязательны в конце выражений.
- В многострочных объектах, массивах, параметрах и импортах ставить завершающую запятую.
- Один оператор или вызов на строку.
- Сложные выражения разбивать на именованные промежуточные значения.
- Не оставлять неиспользуемые импорты, переменные, параметры и закомментированный мертвый код. Это проверяется noUnusedLocals и noUnusedParameters.
- Не использовать any. Для неизвестного значения использовать unknown и выполнить проверку типа.
- Не подавлять ошибки TypeScript через @ts-ignore. @ts-expect-error допускается только с комментарием о причине.
- Не менять форматирование сгенерированных файлов вручную.

### 5.2. Порядок импортов

Импорты группируются в следующем порядке, между группами оставляется пустая строка:

1. Пакеты из node_modules.
2. Алиас @/.
3. Относительные импорты из текущей фичи.

Типовые импорты оформляются через import type:

```ts
import { computed, ref } from 'vue'
import { useLobbyApi } from '@/modules/private/lobby/api/lobbyApi'
import type { LobbyModel } from '@/types/api/generated/models'
import LobbyCard from './LobbyCard.vue'
```

Для cross-feature и cross-layer импорта использовать алиас @. Относительные пути допустимы для соседнего компонента, локального API, store или вложенной подсистемы. Расширения .js и .ts в ручном коде не добавлять. Расширения, созданные Orval, не исправлять вручную.

### 5.3. TypeScript

- Сохранять strict: true и остальные ограничения из tsconfig.app.json и tsconfig.node.json.
- Экспортируемые функции, composables и API-методы имеют явные типы результата.
- Типы входных данных описывать отдельным type или interface, а не анонимным объектом в нескольких местах.
- Для union, alias, tuple и простых контрактов использовать type. interface использовать для расширяемых объектных контрактов.
- Для неизменяемых вариантов использовать as const.
- Для nullable-состояния явно указывать T | null или T | undefined.
- Для ref задавать тип, если он не выводится безопасно: ref<LobbyModel[]>([]).
- Избегать приведений as. Сначала проверять значение через type guard, instanceof, проверку свойства или фабрику.
- Не копировать API-модели вручную. Использовать generated type и createXModel() для начального значения.
- Не смешивать доменные типы из src/types/apiTypes и сгенерированные модели без явного преобразования.

Пример безопасного преобразования ответа:

```ts
const [response, error] = await tryCatch(getLobbyById(lobbyId))

if (error !== null) {
    return
}

const lobby = response.data
```

## 6. Vue Single File Components

### 6.1. Обязательная структура

Каждый новый компонент использует script setup и TypeScript. Блоки располагаются в порядке script, template, style.

```vue
<script setup lang="ts">
import { computed, ref } from 'vue'

type Props = {
    title: string
}
type Emits = {
    close: []
}

const props = defineProps<Props>()

const emit = defineEmits<Emits>()

const isOpen = ref(false)

const normalizedTitle = computed(() => props.title.trim())
</script>

<template>
    <section class="flex flex-col gap-4">
        <h2>{{ normalizedTitle }}</h2>
    </section>
</template>

<style scoped>
/* Component-only CSS goes here when utility classes are insufficient. */
</style>
```

Правила:

- Использовать ровно один корневой элемент в template.
- Не добавлять пустой блок style scoped. Если локальный CSS не нужен, блок опускается.
- Между функциями и переменными должен быть интервал в одну пустую строку
- Использовать defineProps, withDefaults, defineEmits, defineModel и defineExpose только для явного публичного контракта.
- Props не изменять напрямую. Для редактирования создавать локальное состояние или эмитить изменение.
- Emits типизировать через type-подпись.
- Компонент отвечает за отображение и координацию. Бизнес-правила, HTTP, WebSocket и сложные преобразования выносить в composable, API-обертку или store.
- Локальные компоненты импортировать явно и использовать в PascalCase.
- Публичные UI-компоненты экспортировать через src/ui/components/index.ts.

### 6.2. Порядок script setup

Внутри script setup соблюдать порядок:

1. Импорты.
2. Типы и локальные типовые алиасы.
3. defineProps, withDefaults, defineEmits, defineModel.
4. Получение router, route, API, store и composables.
5. Локальные ref, reactive и константы.
6. computed и watch-производные значения.
7. Обработчики и функции действий.
8. onMounted, onUnmounted и другие lifecycle hooks.

Функции, выполняющие побочные эффекты, должны явно называться как действие: loadLobbies, saveCharacter, deleteScene, connectRoom.

### 6.3. Template

- Статический HTML использует семантические элементы: section, form, button, label, nav.
- UI-компоненты библиотек и проекта использовать в PascalCase в новом коде.
- Сложную логику не помещать в атрибуты. Вызов router.push, несколько присваиваний или условную обработку оформлять отдельной функцией.
- Статические inline-стили запрещены. Использовать Tailwind-классы, локальный CSS или API компонента.
- :style разрешен только для значения, вычисляемого во время выполнения, например темы или координаты. Значение должно быть именованным и типизированным.
- v-show не использовать. Для условного рендера применять v-if, v-else-if, v-else.
- v-if и v-for не помещать на один и тот же элемент. Использовать template v-for с отдельным условием.
- Для v-for всегда указывать :key.
- Стабильный идентификатор сущности имеет приоритет. Если идентификатора нет или он не уникален, использовать шаблон entity-id-index.
- Индекс сам по себе запрещен как ключ.
- Не использовать index в ключе, если стабильный id уже гарантирует уникальность.
- Для загрузки, ошибки, пустого результата и успешного результата предусматривать отдельные состояния.
- Для интерактивных элементов добавлять доступное имя: текст кнопки, aria-label, label или связанный id.

Пример списка:

```vue
<template>
    <ul>
        <li v-for="lobby in lobbies" :key="lobby.id">
            <LobbyCard v-bind="lobby" />
        </li>
    </ul>
</template>
```

## 7. Стили и тема

### 7.1. Приоритеты

1. Tailwind-классы для простого layout, spacing, размеров, текста и состояний.
2. Локальный style scoped для сложного селектора, псевдоэлементов, анимаций, media queries и большого набора свойств.
3. Отдельный CSS-файл внутри каталога компонента, если стили переиспользуются несколькими частями компонента или подключаются через @import.
4. src/styles/index.css для Tailwind, шрифтов и theme-токенов.
5. src/ui/styles для действительно общих классов с префиксом c-.

Не создавать глобальный селектор для одного компонента. Не размещать feature-стили в src/styles/index.css.

### 7.2. Имена и область действия CSS

- Общие классы имеют префикс c-: c-flex-row, c-disabled, c-scrollbar.
- Локальные классы должны иметь понятное имя, связанное с компонентом или блоком. В style scoped не требуется искусственно добавлять глобальный префикс.
- Для состояния использовать модификатор или класс состояния: is-active, is-loading, has-error.
- Не использовать глубокие селекторы без необходимости.
- В style scoped писать scoped. Глобальный style разрешен только для действительно глобального поведения и должен иметь комментарий с причиной.
- Повторяющиеся свойства и цвета выносить в токены или общие классы.

### 7.3. Цвета, шрифты и размеры

- Цвета темы добавлять в @theme в src/styles/index.css или в src/utils/colorTheme.ts.
- В компонентах использовать Tailwind-токены и CSS-переменные. Не добавлять случайные hex-цвета в feature-коде.
- Шрифт Slaviansky подключать только через существующий @font-face и токен --font-slav.
- Стили Naive UI менять через его API, theme-overrides или локальный scoped CSS. Не переопределять библиотеку глобально без причины.
- В utility-классах сохранять порядок: layout, display, size, spacing, typography, color, state.

## 8. Composables и состояние

### 8.1. Composables

Composable начинается с use и возвращает явно названные значения и функции.

```ts
export const useModalUtil = <Item, Props>() => {
    const isShowModal = ref(false)
    const item = ref<Item>()
    const props = ref<Props>()

    function openOrClose() {
        isShowModal.value = !isShowModal.value
    }

    return { isShowModal, item, props, openOrClose }
}
```

- Composable не должен скрывать сетевой запрос или побочный эффект под неясным именем.
- Все ресурсы, подписки и listeners, созданные composable, должны иметь cleanup.
- Чистую функцию без Vue-состояния не называть composable. Ее помещать в src/utils или src/composables с обычным функциональным именем.
- Возвращать только публичный контракт. Внутренние refs и вспомогательные функции не экспортировать без необходимости.

### 8.2. Stores

Текущий проект использует module-level refs и composable stores: useAccountStore, useMessageStore, useActiveLobbyStore, useScene, useTokens. Для единообразия:

- Состояние, общее для нескольких компонентов одной фичи, хранить в store фичи.
- Состояние, используемое несколькими фичами, хранить в src/store.
- У store должен быть явный набор действий: addLobby, clearLobby, setTokens, deleteToken.
- Не изменять общий ref из компонентов напрямую, если для него уже существует store-действие.
- Для начального состояния использовать emptyX или createXModel() и копию объекта.
- Не создавать второй паттерн хранения состояния в той же фиче без решения о миграции. Регистрация Pinia в main.ts не разрешает смешивать без причины defineStore и текущие composable stores.
- Не помещать в store UI-состояние одного компонента: открытие локальной панели, значение локального поиска и подобные поля должны быть в компоненте.

### 8.3. Реестр проектных composable

В этом разделе перечислены все авторские composable и composable-подобные точки доступа проекта. Сторонние функции Vue, Naive UI и VueUse, например useRouter, useRoute, useThemeVars, useTemplateRef, useFileDialog, useParentElement и onClickOutside, в этот реестр не входят: их поведение определяется документацией соответствующей библиотеки.

Под composable-подобной точкой доступа здесь понимаются также API-обертки, stores и сервисы WebSocket, которые имеют функцию useX и возвращают состояние или операции для конкретного слоя.

### 8.4. Быстрый выбор

| Точка доступа        | Файл                                                                              | Использовать когда                                                       |
| -------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| tryCatch             | src/composables/tryCatch.ts                                                       | Нужен результат и ошибка в tuple без UI-состояния                        |
| useAlert             | src/composables/useAlert.ts                                                       | Нужно показать пользователю info, success или error notification         |
| useAxiosFactory      | src/composables/useApiFactory.ts                                                  | Нужно создать общий Axios-клиент с auth, retry и logging                 |
| copyText             | src/composables/useCopyText.ts                                                    | Нужно записать строку в clipboard по действию пользователя               |
| searchFilterObject   | src/composables/useFilters.ts                                                     | Нужно выполнить простой локальный регистронезависимый поиск по массиву   |
| useFormSubmit        | src/composables/useFormValidate.ts                                                | Нужно валидировать Naive UI форму и защитить submit от повторного вызова |
| useFormSettings      | src/composables/useFormValidate.ts                                                | Нужны общие правила required и счетчик длины поля                        |
| useModalUtil         | src/composables/useModal.ts                                                       | Нужно управлять одним локальным modal и его item/props                   |
| useReqDefault        | src/composables/useReqDefault.ts                                                  | Нужен стандартный Axios-запрос с loading, error и notification           |
| useSocketFactory     | src/composables/useSocketFactory.ts                                               | Нужно создать Socket.IO namespace через общий Manager                    |
| scrollToBlock        | src/ui/composables/useScrollInBlock.ts                                            | Нужно прокрутить страницу к DOM-блоку по id                              |
| useFormValidate      | src/ui/components/CForm/useFormValidate.ts                                        | Нужно передать результат валидации между частями CForm                   |
| useDialog            | src/ui/components/CModal/useDialog.ts                                             | Нужно открыть глобальное динамическое модальное окно в стеке             |
| useRulesResult       | CSelect и CValidate composable                                                    | Нужно последовательно применить набор низкоуровневых validation rules    |
| useComponentValidate | src/ui/components/CValidate/composable/initValidate.ts                            | Нужно валидировать model ref в кастомном UI-контроле                     |
| useColorTheme        | src/utils/colorTheme.ts                                                           | Нужно получить общую тему приложения и overrides Naive UI                |
| useRoles             | src/enums/index.ts                                                                | Нужно получить идентификаторы и названия ролей                           |
| useAccountStore      | src/store/AccountStore.ts                                                         | Нужно прочитать текущий аккаунт приложения                               |
| useMessageStore      | src/store/MessageStore.ts                                                         | Нужно читать и изменять общее состояние сообщений комнаты                |
| useActiveLobbyStore  | src/modules/private/lobby/store/LobbyStore.ts                                     | Нужно хранить активное лобби между lobby и gameTable                     |
| useScene             | src/modules/private/gameTable/modules/TableScenes/store/scene.ts                  | Нужно читать активную сцену и сигнал смены сцены                         |
| useLayersStore       | src/modules/private/gameTable/modules/TableV3/scene/layer.ts                      | Нужно управлять активным слоем Fabric-токенов                            |
| useTokens            | src/modules/private/gameTable/modules/TableV3/token/store/tokenStore.ts           | Нужно создавать, обновлять, удалять и отображать токены холста           |
| useAuthApi           | src/services/api/auth.ts                                                          | Нужно выполнить login, register, refresh или logout                      |
| useLobbyApi          | src/modules/private/lobby/api/lobbyApi.ts                                         | Нужно вызвать endpoint лобби или участников                              |
| useFileItemApi       | src/modules/private/gallery/api/fileApi.ts                                        | Нужно загрузить, получить, удалить изображение или собрать его URL       |
| useCollectionsApi    | src/modules/private/gallery/api/collectionsApi.ts                                 | Нужно выполнить CRUD коллекций                                           |
| useCharacterApi      | src/modules/private/gameTable/modules/characters/api/charactersApi.ts             | Нужно выполнить CRUD персонажей                                          |
| useSceneApi          | src/modules/private/gameTable/modules/TableScenes/services/sceneApi.ts            | Нужно выполнить CRUD сцен                                                |
| useChatSocket        | src/services/webSocket/roomSocket/chatSocket.ts                                   | Нужно подключить обработчики и отправку сообщений комнаты                |
| useTokenSocket       | src/services/webSocket/roomSocket/tokenSocket.ts                                  | Нужно подключить события CRUD токенов                                    |
| useRoomSocket        | src/services/webSocket/roomSocket/roomSocket.ts                                   | Нужно подключить комнату, игроков и переходы между сценами               |
| useTableCanvas       | src/modules/private/gameTable/modules/TableV3/index.ts                            | Нужно создать и уничтожить Fabric canvas игровой таблицы                 |
| useTokenModificed    | src/modules/private/gameTable/modules/TableV3/token/services/useTokenModificed.ts | Нужно один раз подключить selection и modified handlers к Fabric canvas  |

### 8.5. Базовые composable и утилиты

#### 8.5.1. tryCatch

Файл: src/composables/tryCatch.ts.

Назначение: оборачивает произвольный Promise и возвращает tuple вида [result, null] при успехе или [null, error] при исключении. Внутри также распознает AxiosError.

Использовать:

- в middleware и сервисах, где нужен явный контроль веток success/error;
- когда не нужны refs isLoading и isError;
- когда запрос не должен автоматически показывать notification;
- для API или WebSocket-потоков с собственной обработкой ошибки.

Не использовать:

- для обычного UI-запроса Axios, которому нужны loading и стандартный alert;
- как замену типизированному API-методу;
- для скрытия ошибки без проверки error.

#### 8.5.2. useAlert

Файл: src/composables/useAlert.ts.

Назначение: предоставляет openAlert, openSucces и openError поверх discrete API Naive UI. Notification создается с общей длительностью и возможностью закрытия.

Использовать:

- для короткого пользовательского сообщения после действия;
- для сообщения об ошибке, если UI не имеет отдельного inline error блока;
- в feature-коде после успешного удаления, копирования или сохранения.

Не использовать:

- для логирования технических деталей;
- для каждой ошибки низкого уровня в API-обертке;
- для ошибок валидации поля, которые должны отображаться рядом с полем;
- для замены loading или empty-состояния.

Имена openSucces и другие существующие публичные имена не переименовывать без проверки всех импортов.

#### 8.5.3. useAxiosFactory

Файл: src/composables/useApiFactory.ts.

Назначение: фабрика Axios-клиента. Она подключает request interceptor с user-token, response interceptor с refresh после 401 и logging запросов и ответов.

Использовать:

- только в инфраструктурном слое при создании клиента;
- для нового общего клиента, если ему нужен тот же auth и retry-контракт;
- через уже созданный httpClient в обычных feature API.

Не использовать:

- из Vue-компонента;
- для каждого отдельного запроса;
- вместо feature API wrapper;
- для обхода общего refresh/logout поведения без отдельного решения.

Текущий httpClient в src/services/clients/httpClient.ts создан именно через эту фабрику.

#### 8.5.4. copyText

Файл: src/composables/useCopyText.ts.

Назначение: записывает переданную строку в navigator.clipboard.

Использовать:

- внутри обработчика явного действия пользователя, например кнопки копирования ссылки;
- для коротких текстовых значений, которые пользователь должен получить в буфер обмена.

Не использовать:

- для чтения clipboard;
- для автоматического копирования при монтировании страницы;
- для хранения или передачи секретов без отдельного решения по безопасности.

Текущий helper не преобразует ошибку clipboard в typed result. Если caller должен показать ошибку, helper нужно расширить так, чтобы Promise записи можно было await и обработать через try/catch.

#### 8.5.5. searchFilterObject

Файл: src/composables/useFilters.ts.

Назначение: выполняет регистронезависимый поиск по указанным полям массива объектов и возвращает отфильтрованный массив.

Использовать:

- для небольших массивов уже загруженных сущностей;
- для поиска лобби, сцен или персонажей по одному или нескольким строковым полям;
- внутри computed, чтобы результат автоматически обновлялся при изменении search.

Не использовать:

- для серверного поиска;
- для больших коллекций, где фильтрация должна выполняться backend;
- для вложенных полей, сложных предикатов или сортировки;
- для изменения исходного массива.

#### 8.5.6. useFormSubmit

Файл: src/composables/useFormValidate.ts.

Назначение: связывает FormInst Naive UI с submit-функцией, выполняет validate, устанавливает loading и блокирует повторное выполнение.

Возвращает formRef, rules, loading и handleSubmit.

Использовать:

- в формах, где есть экземпляр Naive UI Form;
- когда submit должен выполняться только после успешной валидации;
- когда нужно единое состояние loading на время асинхронного submit.

Не использовать:

- для простого click без формы;
- для кастомного validation pipeline, не совместимого с FormInst;
- для сетевого запроса вместо useReqDefault: эти composable можно использовать вместе.

#### 8.5.7. useFormSettings

Файл: src/composables/useFormValidate.ts.

Назначение: возвращает общие настройки форм: requiresRule, useFormSubmit и limitStringRender.

Использовать:

- для одинакового обязательного поля с trigger blur;
- для счетчика длины строки вида current / max;
- когда компоненту нужна стандартная submit-логика без копирования правила.

Не использовать:

- для правил, зависящих от конкретной бизнес-сущности;
- для хранения данных формы;
- для замены отдельной схемы сложной валидации.

#### 8.5.8. useModalUtil

Файл: src/composables/useModal.ts.

Назначение: типизированное состояние одного локального modal. Хранит isShowModal, выбранный item, props и функцию openOrClose.

Использовать:

- в списках лобби, сцен и персонажей, где modal работает с выбранной сущностью;
- когда один родитель открывает один modal и передает в него item или props;
- когда нужен generic-контракт для разных типов сущности и параметров.

Не использовать:

- для глобального стека динамических modal;
- для modal, который уже управляется useDialog;
- для простого boolean, не связанного с item/props.

#### 8.5.9. useReqDefault

Файл: src/composables/useReqDefault.ts.

Назначение: стандартный wrapper для Promise<AxiosResponse<T>>. Управляет isLoading и isError, показывает error notification и по флагу isSuccesAlert показывает success notification.

Возвращает isLoading, isError и request.

Использовать:

- в view или компоненте для обычного запроса через feature API;
- для CRUD-операций, где нужен единый loading/error/notification flow;
- несколько раз в одном компоненте, если у независимых операций должны быть независимые loading-состояния.

Не использовать:

- для Socket.IO событий;
- для произвольного Promise, который не возвращает AxiosResponse;
- если ошибка должна быть обработана полностью вручную через tryCatch;
- в API-обертке, чтобы не связывать инфраструктуру с UI.

#### 8.5.10. useSocketFactory

Файл: src/composables/useSocketFactory.ts.

Назначение: возвращает Socket.IO socket для namespace через общий Manager с autoConnect false.

Использовать:

- внутри socket-сервисов, например для namespace /room;
- когда соединение должно подключаться явно через connect;
- при добавлении нового socket namespace, если он использует тот же backend.

Не использовать:

- в обычном компоненте;
- для повторного создания Manager;
- для прямого хранения socket в локальном UI-состоянии.

#### 8.5.11. scrollToBlock

Файл: src/ui/composables/useScrollInBlock.ts.

Назначение: находит элемент по DOM id и вызывает smooth scrollIntoView. Возвращает true, если элемент найден, иначе false.

Использовать:

- для перехода к известному блоку внутри текущей страницы;
- после действия пользователя, когда элемент уже существует в DOM.

Не использовать:

- для layout-переходов между route;
- вместо template ref, если компонент может передать реальный DOM ref;
- до монтирования целевого элемента.

### 8.6. UI composable

#### 8.6.1. useFormValidate

Файл: src/ui/components/CForm/useFormValidate.ts.

Назначение: хранит общий reactive-флаг isResult и предоставляет setResult. Это низкоуровневый контракт текущего CForm.

Использовать:

- только для интеграции компонентов, которые действительно обмениваются результатом через CForm;
- когда результат валидации должен быть прочитан другим участником CForm.

Не использовать:

- для обычных Naive UI Form: применять useFormSubmit;
- для независимой формы, которой не нужен общий флаг;
- для нескольких параллельных форм без отдельного экземпляра состояния, потому что isResult является module-level ref.

#### 8.6.2. useDialog

Файл: src/ui/components/CModal/useDialog.ts.

Назначение: управляет глобальным стеком динамических компонентов modal. open добавляет компонент и его componentProps, close удаляет последний элемент, modals читается CModalRender, modalRef хранит ref текущего modal.

Использовать:

- для открытия ConfirmModal, DeleteModal и других глобальных modal из разных feature;
- когда modal должен рендериться через общий CModalRender;
- когда нужен typed componentProps для динамического компонента.

Не использовать:

- для одного локального modal внутри view: использовать useModalUtil;
- для обычного drawer, dropdown или inline panel;
- для прямого изменения массива modals из компонентов.

#### 8.6.3. useRulesResult

Файлы: src/ui/components/CValidate/composable/useRulesComposable.ts и src/ui/components/CSelect/composables/useRulesComposable.ts.

Назначение: последовательно вызывает функции rules и возвращает первый результат, который не равен true, либо true при успешной проверке.

Использовать:

- как внутренний low-level механизм CValidate и CSelect;
- когда правила имеют единый контракт: rule получает unknown и возвращает true или сообщение об ошибке.

Не использовать:

- как замену FormRules Naive UI;
- для изменения ref ошибки или UI-состояния;
- для копирования еще одной версии этой функции в новый компонент.

В проекте сейчас существуют две одинаковые реализации. Это историческое дублирование. Новый код не должен увеличивать число копий; при изменении validation-архитектуры нужно выбрать один общий источник и обновить оба потребителя.

#### 8.6.4. useComponentValidate

Файл: src/ui/components/CValidate/composable/initValidate.ts.

Назначение: связывает model ref с массивом rules. Возвращает validate, isValidComponent и errorMessage.

Использовать:

- в кастомных контролах CInput, CTextarea и CCheckBox;
- когда компонент должен самостоятельно проверить собственный model и показать текст ошибки;
- для валидации, не проходящей через Naive UI FormInst.

Не использовать:

- для сложной серверной валидации;
- для общей валидации всей формы;
- вместо useFormSubmit в форме Naive UI.

### 8.7. Тема, роли и stores

#### 8.7.1. useColorTheme

Файл: src/utils/colorTheme.ts.

Назначение: возвращает общий объект theme из allColors и reactive overrides для Naive UI.

Использовать:

- в App.vue при создании n-config-provider;
- в UI-компоненте, которому нужны согласованные цвета, шрифты или radius;
- при добавлении новой темы после обновления allColors.

Не использовать:

- для локального случайного цвета;
- для прямого изменения theme в каждом компоненте;
- вместо Tailwind-токенов для обычного layout.

#### 8.7.2. useRoles

Файл: src/enums/index.ts.

Назначение: возвращает RolesIds, LobbyRoles и PlatformRoles.

Использовать:

- для проверки роли пользователя;
- для отображения названия роли;
- при отправке roleId в lobby API.

Не использовать:

- для hardcode чисел ролей в компонентах;
- для хранения текущей роли пользователя: ее источник useAccountStore;
- для изменения списка ролей без проверки backend-контракта.

#### 8.7.3. useAccountStore

Файл: src/store/AccountStore.ts.

Назначение: предоставляет общий ref account с данными текущего пользователя.

Использовать:

- для чтения account в navbar, auth view, lobby и gameTable;
- в auth API для записи результата login, register и refresh;
- в router middleware для проверки авторизованного пользователя.

Не использовать:

- для локальной копии пользователя без необходимости;
- для прямой записи account.value из UI-компонента;
- вместо role helper useRoles.

#### 8.7.4. useMessageStore

Файл: src/store/MessageStore.ts.

Назначение: хранит messages и действия addMessage, removeMessage, clearMessages.

Использовать:

- в chatSocket для приема сообщений;
- в ChatBlock и MessagesBlock для отображения общего чата;
- для очистки сообщений при смене комнаты или logout.

Не использовать:

- для локального текста input;
- для сообщений notification: для них использовать useAlert.

#### 8.7.5. useActiveLobbyStore

Файл: src/modules/private/lobby/store/LobbyStore.ts.

Назначение: хранит текущее LobbyModel и действия addLobby и clearLobby.

Использовать:

- после загрузки лобби, чтобы передать его между LobbyView и GameView;
- в компонентах игровой комнаты, которым нужны lobby id, link, members или owner;
- clearLobby при завершении жизненного цикла активного лобби.

Не использовать:

- для списка всех лобби в LobbyCardList: список должен быть локальным состоянием view;
- для временного объекта формы, если он еще не стал активным лобби.

#### 8.7.6. useScene

Файл: src/modules/private/gameTable/modules/TableScenes/store/scene.ts.

Назначение: предоставляет activeScene и newSceneId для синхронизации TableScenes, GameView и room socket.

Использовать:

- для чтения и смены текущей сцены игровой таблицы;
- для передачи сигнала о смене сцены через newSceneId;
- в token store, чтобы отфильтровать токены по activeScene.

Не использовать:

- для списка сцен: список должен храниться в SceneNavbarMenu или отдельном feature store;
- для данных lobby или токенов.

#### 8.7.7. useLayersStore

Файл: src/modules/private/gameTable/modules/TableV3/scene/layer.ts.

Назначение: хранит выбранный слой Fabric-токенов и предоставляет topTokens, topTokensInitWatcher и checkLayer.

Использовать:

- в LayersTabs для смены objects, map или master;
- в TableV3 для включения и отключения selectable, evented и controls у токенов;
- при изменении порядка отображения токенов на Canvas.

Не использовать:

- для CSS z-index;
- для общего UI-состояния;
- без переданного Fabric Canvas в функциях, которые требуют canvas.

#### 8.7.8. useTokens

Файл: src/modules/private/gameTable/modules/TableV3/token/store/tokenStore.ts.

Назначение: управляет коллекцией Token и синхронизирует ее с Fabric Canvas. Возвращает tokens, imgDragToken, setTokens, setToken, createToken, updateToken и deleteToken.

Использовать:

- в tokenSocket при обработке token-get-all, create-token, update-token и delete-token;
- в TableIndex и token components;
- для фильтрации токенов по activeScene и обновления порядка слоев.

Не использовать:

- для обычных HTML-элементов;
- для прямого изменения Canvas в компоненте, если уже есть store action;
- для сохранения токена без socket-контракта.

### 8.8. API composable

API composable являются тонкими feature-обертками над httpClient. Они возвращают методы, которые выполняют HTTP-запрос и возвращают AxiosResponse. Loading, alert и UI error обрабатываются на вызывающей стороне через useReqDefault или tryCatch.

#### 8.8.1. useAuthApi

Файл: src/services/api/auth.ts.

Методы: loginReq, registerReq, refreshReq, logoutReq и authQClient.

Использовать:

- в AuthIndex для login и register;
- в router middleware для refresh;
- в NavBar или другом logout action для выхода;
- когда нужно синхронно обновить user-token и account.

Не использовать:

- для обычных feature endpoint-ов;
- для прямой записи user-token из компонентов;
- для обхода router redirect после logout.

#### 8.8.2. useLobbyApi

Файл: src/modules/private/lobby/api/lobbyApi.ts.

Методы работают с лобби и lobby members: getLobbies, getLobbyById, getLobbyByLink, getLobbyByInviteLink, createOrUpdateLobby, deleteLobby, getLobbyMembers, createOrUpdateLobbyMember и deleteLobbyMember.

Использовать:

- в lobby views and components;
- в invite flow;
- в PlayersBlock для управления участниками.

Не использовать:

- для хранения active lobby: для этого нужен useActiveLobbyStore;
- для фильтрации уже загруженного списка: использовать searchFilterObject;
- для доступа к изображениям, сценам или персонажам.

#### 8.8.3. useFileItemApi

Файл: src/modules/private/gallery/api/fileApi.ts.

Методы: uploadImages, getImages, deleteImage, deleteAllImages и imageFileUrl.

Использовать:

- в gallery для загрузки и удаления изображений;
- в MediaBlock;
- в CharacterSaveImg для выбора доступного изображения;
- imageFileUrl использовать для единого построения URL backend image.

Не использовать:

- для коллекций: использовать useCollectionsApi;
- для локального preview до загрузки, если достаточно object URL;
- для ручного создания URL через конкатенацию в каждом компоненте.

#### 8.8.4. useCollectionsApi

Файл: src/modules/private/gallery/api/collectionsApi.ts.

Методы: getCollections, createOrUpdateCollection и deleteCollection.

Использовать:

- в CollectionsIndex;
- в modal создания и редактирования коллекции;
- при удалении коллекции через существующий confirm flow.

Не использовать:

- для списка файлов;
- для локального состояния открытого modal;
- для user или lobby endpoint-ов.

#### 8.8.5. useCharacterApi

Файл: src/modules/private/gameTable/modules/characters/api/charactersApi.ts.

Методы: getCharacters, getCharacterById, setCharacter и deleteCharacter.

Использовать:

- в CharactersView для загрузки и удаления;
- в CreateOrEditCharacterModal для создания и обновления;
- вместе с useActiveLobbyStore для lobbyId.

Не использовать:

- для Token CRUD;
- для изображений без useFileItemApi;
- для локальной фильтрации списка без searchFilterObject.

#### 8.8.6. useSceneApi

Файл: src/modules/private/gameTable/modules/TableScenes/services/sceneApi.ts.

Методы: getScenes, getSceneById, createOrupdateScene и deleteScene.

Использовать:

- в SceneNavbarMenu;
- в SceneCreateOrEditModal;
- в GameViewIndex для начальной сцены и перехода игроков.

Не использовать:

- для хранения activeScene: использовать useScene;
- для WebSocket-события перехода игроков: использовать useRoomSocket;
- для canvas-token операций.

### 8.9. WebSocket composable

#### 8.9.1. useChatSocket

Файл: src/services/webSocket/roomSocket/chatSocket.ts.

Назначение: принимает Socket через initChatSocket, подписывается на room-chat-all-messages и room-chat-new-message, а также предоставляет loadAllMessages и setNewMessage.

Использовать:

- один раз при инициализации room socket;
- в ChatBlock и DiceBlockForm для отправки обычных и игровых сообщений;
- вместе с useMessageStore для приема сообщений.

Не использовать:

- для создания нового Socket.IO Manager;
- для lobby HTTP-запросов;
- для прямого изменения messages без store action.

#### 8.9.2. useTokenSocket

Файл: src/services/webSocket/roomSocket/tokenSocket.ts.

Назначение: подключает обработчики token-get-all, create-token, delete-token и update-token и предоставляет emit-методы для этих операций.

Использовать:

- в roomSocket при инициализации;
- в TableV3 и Token-классах для синхронизации действий;
- вместе с useTokens, useScene и useActiveLobbyStore для payload.

Не использовать:

- для обычных API-запросов;
- для создания token только в локальном Canvas без отправки backend;
- для chat events.

#### 8.9.3. useRoomSocket

Файл: src/services/webSocket/roomSocket/roomSocket.ts.

Назначение: управляет room namespace, activeRoom, подключением и событиями игроков. Предоставляет connectRoom, diconnectedRoom, blockPlayer и moveScene.

Использовать:

- при входе и выходе из игровой комнаты;
- для синхронизации активных игроков;
- для block-player и move-players;
- для передачи roomLink и пользователя в connectRoom.

Не использовать:

- вместо useChatSocket или useTokenSocket;
- для загрузки lobby через HTTP;
- для локального переключения activeScene без серверного события, когда нужна синхронизация игроков.

Имя diconnectedRoom является существующим публичным именем с опечаткой. Не исправлять его без обновления всех потребителей и совместимого перехода.

### 8.10. Canvas composable и сервисы

#### 8.10.1. useTableCanvas

Файл: src/modules/private/gameTable/modules/TableV3/index.ts.

Назначение: создает Fabric Canvas на element с id container, подключает resize, viewport, drag and drop, grid, token modification handlers и начальное добавление токенов. deleteCanvas очищает токены и уничтожает Canvas.

Использовать:

- в TableIndex: init в onMounted и deleteCanvas в onUnmounted;
- только для жизненного цикла игрового холста;
- при повторной инициализации после гарантированного уничтожения предыдущего Canvas.

Не использовать:

- в обычных UI-компонентах;
- для чтения списка токенов без useTokens;
- для ручного добавления listeners в разных views.

#### 8.10.2. useTokenModificed

Файл: src/modules/private/gameTable/modules/TableV3/token/services/useTokenModificed.ts.

Назначение: подключает к Fabric Canvas обработчики selection:created, selection:cleared и object:modified, поддерживает групповой выбор и отправляет изменения токенов через updateTokenFunc.

Использовать:

- только внутри useTableCanvas после создания Canvas;
- один раз для одного Canvas;
- если меняется поведение группового выбора или сохранения позиции токена.

Не использовать:

- как UI composable;
- повторно при каждом рендере;
- для создания или удаления токена вместо useTokenSocket и useTokens.

Имя useTokenModificed исторически содержит опечатку. Не переименовывать без обновления импорта и всех потребителей.

## 8.11. Правила выбора между похожими composable

- useReqDefault выбирается для обычного Axios-запроса из UI, когда нужны loading, error и стандартные notification.
- tryCatch выбирается для сервисного или middleware-сценария с ручным разбором tuple и без UI-обвязки.
- useModalUtil выбирается для локального modal с typed item/props.
- useDialog выбирается для глобального динамического modal в CModalRender.
- useFormSubmit выбирается для Naive UI FormInst.
- useComponentValidate выбирается для самостоятельного custom input с model ref.
- useAlert выбирается для пользовательского сообщения, а не для технического логирования.
- useActiveLobbyStore, useScene, useAccountStore и useMessageStore выбираются по области владения состоянием. Не создавать локальную копию общего состояния без причины.
- API composable выбирается по backend-сущности. Не вызывать httpClient из view напрямую.
- useRoomSocket, useChatSocket и useTokenSocket разделены по WebSocket-контрактам. Не смешивать их события в одном компоненте.
- useTableCanvas и useTokenModificed относятся только к Fabric Canvas и не должны использоваться в обычном UI.

## 9. HTTP и API

### 9.1. Слои запросов

Поток обычного запроса:

```text
component/view -> feature API wrapper -> httpClient -> Axios interceptors -> backend
```

- src/services/clients/httpClient.ts является общим Axios-клиентом с baseURL, credentials, авторизацией, логированием и повтором после 401.
- API фичи размещается рядом с фичей в api, например src/modules/private/lobby/api/lobbyApi.ts.
- Auth API размещается в src/services/api/auth.ts, потому что управляет токеном, аккаунтом и переходом после logout.
- Компоненты и views не создают Axios-клиенты и не вызывают fetch напрямую.
- Прямой fetch допускается только в сгенерированном Orval-файле и не должен копироваться в ручной код.

Пример API-обертки:

```ts
import type { AxiosResponse } from 'axios'
import { httpClient } from '@/services/clients/httpClient'
import type { LobbyModel } from '@/types/api/generated/models'

export const useLobbyApi = () => {
    const url = '/api/lobbies'

    async function getLobbies(): Promise<AxiosResponse<LobbyModel[]>> {
        return httpClient.get(url)
    }

    return { getLobbies }
}
```

### 9.2. Обработка запросов

- Для стандартного запроса из компонента использовать useReqDefault. Он предоставляет isLoading, isError, request и стандартные уведомления.
- Для сценария, где нужен явный tuple [result, error] без UI-обвязки, использовать tryCatch.
- API-обертка не показывает уведомления и не меняет UI-состояние компонента.
- Не глотать ошибку без причины. Если ошибка намеренно игнорируется, оставить комментарий с объяснением.
- После запроса отображать loading, error и empty-состояния.
- Не дублировать глобальную обработку 401 в feature API. Она находится в Axios interceptor и auth API.

### 9.3. Авторизация

- Токен хранится под ключом user-token.
- Установка и удаление токена выполняются только в auth API или общей auth-инфраструктуре.
- Вручную не дублировать формат Bearer <token> в компонентах.
- Данные пользователя обновляются через useAccountStore.
- Проверка доступа к маршрутам выполняется в src/router/middleware.ts. Проверки бизнес-состояния лобби или конкретной сцены остаются в feature-коде.

## 10. WebSocket и игровые события

- Socket.IO создается через useSocketFactory. Используется общий Manager с autoConnect: false.
- Подключение комнаты находится в src/services/webSocket/roomSocket/roomSocket.ts.
- Логика чата и токенов разделена на chatSocket.ts и tokenSocket.ts.
- UI вызывает методы socket-сервиса (connectRoom, moveScene, setNewMessage, createTokenFunc) и не регистрирует глобальные обработчики событий самостоятельно.
- Все события имеют типизированный payload из src/types/apiTypes/lobbyRoom.
- Имя события и payload должны быть одинаковыми на всех отправителях и обработчиках.
- Подписки создаются один раз на жизненный цикл сервиса. Не добавлять повторную подписку при каждом рендере компонента.
- При отключении удалять подписки или закрывать соединение, если сервис не является намеренно глобальным.
- Обновление UI выполняется через store или refs, а не через прямое изменение DOM.
- Ошибки соединения обрабатываются явно. Нельзя считать успешной отправку события только потому, что вызван emit.

## 11. Роутинг и доступ

- Корневые маршруты находятся в src/router/index.ts.
- Auth-маршруты находятся в src/router/auth.ts.
- Приватные маршруты собираются в src/router/private и feature-router модулях.
- Для каждого feature-маршрута использовать стабильное name, понятный path и props: true, если параметры path передаются в view.
- Метаданные маршрутов типизируются через RouteNodeMeta: isPublic, roles, title.
- Общая проверка токена и ролей остается в checkAuthRoute.
- Для перехода использовать именованный маршрут и params, когда такой маршрут объявлен. Не дублировать URL-строки в десятках компонентов.
- Маршрут не должен содержать запросы к API или логику изменения store.
- После добавления маршрута проверить redirect, middleware, NotFoundView, прямой переход по URL и обновление страницы.

## 12. Формы, модальные окна и уведомления

- Сложные формы используют CForm, useFormSubmit, useFormSettings или соответствующий компонент Naive UI.
- Правила валидации выносить в именованные переменные или composable. Не дублировать одинаковое правило в нескольких шаблонах.
- Кнопка submit должна иметь состояние loading и быть защищена от повторного выполнения.
- Для modal state использовать useModalUtil или существующий useDialog/useModal API.
- Модальные окна должны иметь typed props и typed emits.
- Для подтверждения удаления использовать существующий modal-контракт, а не создавать новый способ подтверждения в каждой feature.
- Уведомления показывать через useAlert или провайдер Naive UI. Не создавать произвольные глобальные notification singleton.
- Текст ошибки должен быть понятен пользователю, а технические детали писать в консоль только при необходимости диагностики.

## 13. Типы и генерация API

### 13.1. Сгенерированный код

Каталог src/types/api/generated генерируется Orval. Он содержит api.ts, models/_.ts и models/_.factory.ts.

Правила:

1. Не редактировать сгенерированные файлы вручную.
2. Не добавлять в них бизнес-логику.
3. Не форматировать их отдельным стилем.
4. После изменения Swagger запускать npm run gen.
5. Проверять diff сгенерированных файлов и компиляцию.
6. Если нужен UI- или доменный тип, создать ручной тип рядом с соответствующей feature, а не менять generated model.

### 13.2. Ручные доменные типы

Ручные типы находятся в src/types/apiTypes и включают комнаты, сообщения, токены, сцены, файлы и другие payload-ы. Для каждого нового контракта:

- описать входной и выходной payload отдельно, если они различаются;
- создать emptyX, если тип используется как начальное реактивное состояние;
- использовать Pick, Omit и indexed access types для связи с существующими типами;
- не дублировать поля пользователя, лобби или сцены в каждом файле;
- синхронизировать изменение payload с WebSocket-сервисом и всеми обработчиками.

## 14. Ассеты и окружение

- Импортируемые изображения и SVG размещать в src/assets и импортировать через alias @/assets/....
- Публичные файлы, доступные по фиксированному URL, размещать в public.
- Шрифты, импортируемые из public, подключать через существующий @font-face.
- Переменные окружения Vite должны начинаться с VITE_.
- При добавлении переменной обновлять типы в src/vite-env.d.ts.
- Не хранить секреты в VITE_*: эти значения попадают в клиентский bundle.
- Не добавлять реальные токены, ключи и пароли в .env или коммиты.
- URL API брать из VITE_APP_API, публичный URL приложения - из VITE_APP. Не дублировать адреса backend в компонентах.

## 15. Комментарии и технический долг

- Комментарий должен объяснять причину решения, ограничение библиотеки или важный контракт.
- Не комментировать очевидную строку вместо улучшения имени.
- Не оставлять большой блок закомментированного старого кода.
- TODO должен описывать конкретную незавершенную задачу и условие, при котором ее нужно закрыть.
- Опечатки в публичных именах исправлять только с проверкой всех потребителей и API-контрактов.
- Если временное решение влияет на архитектуру, добавить короткий комментарий и указать безопасный путь удаления.

## 16. Рабочий процесс изменения

Перед началом изменения:

1. Найти существующий компонент, composable, API-метод или store, который уже решает похожую задачу.
2. Определить слой, которому принадлежит новая логика.
3. Проверить типы API и существующие фабрики начальных значений.
4. Проверить зависимости и не создавать новый cross-feature импорт без необходимости.

Во время изменения:

1. Сначала изменить контракт типов, если меняется payload.
2. Затем обновить API или WebSocket-слой.
3. Затем обновить store/composable.
4. Затем подключить view и UI.
5. Добавить loading, error, empty и success-состояния.
6. Удалить неиспользуемый код и проверить именование измененных участков.

Перед коммитом:

1. Проверить git diff и убедиться, что в нем только относящиеся к задаче файлы.
2. Запустить npm run build.
3. Если менялась Swagger-схема, запустить npm run gen и повторно проверить сборку.
4. Проверить прямой переход на измененный маршрут и основные пользовательские сценарии.
5. Проверить отсутствие секретов, временных логов и случайных изменений dist.

Текущий формат сообщений коммитов использует префиксы в квадратных скобках. Для новых коммитов применять один из вариантов:

```text
[FEAT] add lobby collection filter
[FIX] handle expired access token
[REFACTOR] extract scene API wrapper
[CHORE] update generated API types
```

Сообщение должно кратко описывать результат изменения, а не процесс работы.

## 17. Контрольный список для ревью

### Архитектура

- [ ] Код находится в правильном слое и feature-каталоге.
- [ ] Нет прямого HTTP, WebSocket или localStorage-кода в UI без обоснованного исключения.
- [ ] Не создан дубликат существующего composable, store или UI-компонента.
- [ ] Нет циклической зависимости.

### TypeScript

- [ ] Нет any, @ts-ignore и неиспользуемых импортов.
- [ ] Публичные функции и API-методы типизированы.
- [ ] Использованы generated models и фабрики, где они уже существуют.
- [ ] Nullable-состояния обработаны явно.

### Vue

- [ ] Используется <script setup lang="ts">.
- [ ] У template один корневой элемент.
- [ ] Props и emits типизированы.
- [ ] Нет v-show, inline static styles или сложной логики в атрибутах.
- [ ] У каждого v-for есть стабильный :key.
- [ ] Предусмотрены loading, error и empty-состояния.

### Стили

- [ ] Tailwind и существующие theme-токены используются прежде новых CSS-правил.
- [ ] Локальные стили scoped.
- [ ] Глобальные классы имеют префикс c-.
- [ ] Нет случайных hardcoded цветов и глобальных селекторов feature-компонента.

### Проверка

- [ ] npm run build выполнен после изменения.
- [ ] npm run gen выполнен, если менялся Swagger-контракт.
- [ ] git diff просмотрен.
- [ ] Изменены только нужные файлы.

## 18. Правило для существующего кода

Кодовая база содержит исторические отклонения: смешанные кавычки и точки с запятой, разные варианты имен файлов, относительные импорты с .js, inline-стили и компоненты с неодинаковым оформлением style. Эти отклонения не являются новыми правилами.

При изменении существующего файла:

1. Не выполнять массовый косметический рефакторинг без отдельной задачи.
2. Новые строки писать по этому документу.
3. Измененный блок постепенно приводить к целевому стилю.
4. Не менять публичные имена и контракты только ради форматирования.
5. Сгенерированные файлы оставлять под контролем Orval.

Если правило этого документа конфликтует с фактическим API, типами backend или ограничением библиотеки, зафиксировать конфликт в описании изменения и обновить этот документ после принятого архитектурного решения.
