# Firebase con Angular y Gemini API - Curso de Platzi

Este repositorio corresponde a un curso de **Firebase con Angular y Gemini API** de **PLATZI** dictado por **Sergie Code**.

## 📚 Temas del Curso

El curso abarca los siguientes temas:

- ✅ Instalaciones necesarias
- ✅ Iniciar proyecto Angular
- ✅ Explicar estructura Angular 20
- ✅ Crear repositorio en Github para manejar versiones
- ✅ Introducción a Firebase
- ✅ Agregar Firebase a Angular 20
- ✅ Introducción a Google Gemini
- ✅ Agregar variables de entorno
- ✅ Crear Componentes, Servicios, Guard y Modelos
- ✅ Agregar Rutas
- ✅ Agregar estilos generales
- ✅ Componente de Autenticación
- ✅ Componente de Chat
- ✅ Agregar Modelos de Usuario y Chat
- ✅ Actualizar Archivo de Configuración
- ✅ Auth Service
- ✅ Chat Service
- ✅ Firestore Service
- ✅ Gemini Service
- ✅ Implementar Auth Guard
- ✅ Despliegue en Firebase Hosting
- ✅ Firebase Studio prompts y ejemplos

## 🏢 Sobre Platzi

**Platzi** es una plataforma de educación en línea enfocada en el desarrollo profesional, especialmente en áreas como tecnología, negocios, marketing y diseño. Ofrece cursos, rutas de aprendizaje y programas en vivo dictados por expertos de la industria, con un modelo de suscripción que permite acceso ilimitado a su catálogo. Su comunidad activa y su enfoque en el aprendizaje constante la convierten en una de las principales opciones de formación digital en Latinoamérica y el mercado hispanohablante.

## 👨‍💻 Sobre Sergie Code

**Sergie Code** es un Software Engineer especializado en Frontend y actualmente se desempeña como Tech Lead liderando dos equipos de desarrolladores en una reconocida empresa americana de seguros. Además, es creador de contenido tecnológico y educativo, ofreciendo cursos gratuitos de programación en su canal de YouTube y compartiendo a diario en Instagram, TikTok y otras redes sociales tips, recomendaciones y novedades del mundo del desarrollo y la inteligencia artificial.

Ha dictado clases en la UTN, en los programas Codo a Codo y Argentina Programa 4.0, y también ha desarrollado e impartido cursos de HTML, CSS, JavaScript y ReactJs en la carrera Certified Tech Developer de Digital House.

En el marco de su colaboración con Platzi, recientemente filmó en Bogotá, Colombia, tres cursos para la nueva etapa de contenidos 2025/2026:
- **Fundamentos de Python**
- **Firebase con Angular y Gemini**
- **Monorepo NX con Angular y NodeJS**

Asimismo, lanzó cursos propios en el área de Data, como Introducción a Python y Programación en Python, donde enseña esta tecnología desde cero.

Su formación incluye estudios en Ingeniería Electrónica en la UNC, la certificación como Java Developer Engineer en Educación IT y una extensa capacitación en frameworks y tecnologías a través de cursos online. Además de su perfil técnico, se ha desarrollado como músico independiente, lo que potenció su creatividad y habilidades comunicacionales.

Gracias a su experiencia, posee destacadas soft skills, comodidad al hablar en público y ha participado como orador en eventos multitudinarios como ADA13, Fingurú y SAIA en la UTN.

### 🌐 Redes Sociales de Sergie Code

- 📸 **Instagram**: https://www.instagram.com/sergiecode
- 🧑🏼‍💻 **LinkedIn**: https://www.linkedin.com/in/sergiecode/
- 📽️ **YouTube**: https://www.youtube.com/@SergieCode
- 😺 **GitHub**: https://github.com/sergiecode
- 👤 **Facebook**: https://www.facebook.com/sergiecodeok
- 🎞️ **TikTok**: https://www.tiktok.com/@sergiecode
- 🕊️ **Twitter**: https://twitter.com/sergiecode
- 🧵 **Threads**: https://www.threads.net/@sergiecode

## 🚀 Tecnologías Utilizadas

- **Angular 20** - Framework principal del frontend
- **Firebase** - Backend as a Service para autenticación y base de datos
- **Firestore** - Base de datos NoSQL de Firebase
- **Firebase Hosting** - Servicio de hosting para despliegue
- **Google Gemini API** - Integración con IA de Google
- **TypeScript** - Lenguaje de programación principal

## � Imports de Firebase en Firestore Service

El servicio de Firestore utiliza las siguientes funciones e interfaces de Firebase:

### 📦 Funciones Principales

- **`Firestore`** - Instancia principal de la base de datos Firestore que permite acceder a todas las funcionalidades
- **`collection`** - Función para obtener una referencia a una colección específica en Firestore
- **`addDoc`** - Función para agregar un nuevo documento a una colección de Firestore
- **`query`** - Función para crear consultas personalizadas con filtros y ordenamientos
- **`where`** - Función para aplicar filtros condicionales en las consultas (ej: where('campo', '==', 'valor'))
- **`onSnapshot`** - Función para escuchar cambios en tiempo real en documentos o consultas

### 🔧 Tipos e Interfaces

- **`QuerySnapshot`** - Tipo que representa el resultado de una consulta, contiene los documentos encontrados
- **`DocumentData`** - Tipo genérico que representa los datos de un documento de Firestore
- **`Timestamp`** - Clase para manejar fechas y timestamps de manera compatible con Firestore

### 💡 Uso en el Proyecto

Estos imports permiten:
- ✅ Guardar mensajes de chat en tiempo real
- ✅ Escuchar cambios en las conversaciones automáticamente
- ✅ Aplicar filtros por usuario
- ✅ Manejar fechas de forma correcta con Firebase
- ✅ Mantener sincronización en tiempo real entre usuarios

## �🛠️ Instalación y Configuración

Para ejecutar este proyecto localmente, consulta el archivo `instalaciones-necesarias.md` que contiene todas las dependencias y pasos necesarios.