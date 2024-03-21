const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			user: [
				{
					"id": "",
					"role": "",
					"username": "",
					"name": "",
					"lastname": "",
					"dni": "",
					"email": "",
					"phone": "",
					"password": "",
					"virtual_link": "",
					"is_active": "",
					"isAuthenticated": false,
					"reset_token": ""
				},
			],
			unavailableDates: [],
			consultations: [
				{
					"id": "",
					"name": "",
					"lastname": "",
					"age": "",
					"phone": "",
					"consultation": "",
					"is_read": false,
					"is_deleted": false,
					"arrival_date ": "",
					"arrival_date": "",
				}
			],
			preferenceId: null,
			dates: [{
				"date": "",
				"times": []
			}],
			globalEnabled: [{
				"id": "",
				"day": "",
				"start_hour": "",
				"end_hour": ""
			}],
			globalEnabledByDay: [{
				"id": "",
				"day": "",
				"start_hour": "",
				"end_hour": ""
			}]
		},
		actions: {
			//Funciones globales
			apiFetch: async (endpoint, method = 'GET', body = null) => {
				try {
					let params = {
						method,
						headers: {
							"Access-Control-Allow-Origin": "*"
						}
					};

					if (body !== null) {
						params.body = JSON.stringify(body);
						params.headers["Content-Type"] = "application/json";
					}
					if (body != null) {
						params.body = JSON.stringify(body)
					}
					let resp = await fetch(process.env.BACKEND_URL + "api" + endpoint, params);

					if (!resp.ok) {
						console.error(resp.statusText);
						return { error: resp.statusText };
					}

					return resp.json()
				} catch (error) {
					console.error("Error:", error)
				}
			},
			protectedFetch: async (endpoint, method = "GET", body = null) => {
				const token = localStorage.getItem("token")
				if (!token) {
					throw new Error("Token not found.");
				}
				try {
					let params = {
						method,
						headers: {
							"Access-Control-Allow-Origin": "*",
							"Authorization": "Bearer " + token
						},
					}
					if (body != null) {
						params.headers["Content-Type"] = "application/json"
						params.body = JSON.stringify(body)
					}
					let resp = await fetch(process.env.BACKEND_URL + "api" + endpoint, params)
					if (!resp.ok) {
						console.error(resp.statusText)
						return { error: resp.statusText }
					}
					return resp
				} catch (error) {
					return error
				}
			},
			//Funciones de login, logout y recupero de contraseña
			logout: async () => {
				await getActions().protectedFetch("/logout", "POST", null)
				localStorage.removeItem("token")
			},
			loginUser: async (username, password) => {
				try {
					const response = await getActions().apiFetch('/login', 'POST', {
						username: username,
						password: password
					});

					if (!response.ok) {
						throw new Error('Failed to log in');
					}

					const responseData = await response.json();
					const token = responseData.token || "";
					const userRole = responseData.role || "";

					localStorage.setItem('token', token);
					console.log("Token almacenado en localStorage:", token);

					setStore({ isAuthenticated: true, role: userRole });

					return { success: true, message: responseData.message };
				} catch (error) {
					console.error("Error al realizar la solicitud:", error);
					const errorMessage = error.message || 'Error de red';
					if (error.response && error.response.status === 404) {
						return { success: false, error: 'El usuario no está registrado' };
					} else if (error.response && error.response.status === 401) {
						return { success: false, error: 'La contraseña es incorrecta' };
					} else {
						return { success: false, error: errorMessage };
					}
				}
			},
			//Funciones para el recupero de contraseña		
			handleResetPassword: async (email) => {
				try {
					const response = await fetch(process.env.BACKEND_URL + '/api/reset_password', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*',
						},
						body: JSON.stringify({ email })
					});

					const data = await response.json();
					if (!response.ok) {
						throw new Error(data.error || 'Error al enviar la solicitud');
					}
					return data;
				} catch (error) {
					throw new Error(error.message || 'Error al enviar la solicitud');
				}
			},
			handleChangePassword: async (username, token, newPassword) => {
				try {
					const response = await fetch(process.env.BACKEND_URL + '/api/change_password', {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
							'Access-Control-Allow-Origin': '*',
						},
						body: JSON.stringify({
							username: username,
							token: token,
							new_password: newPassword
						})
					});
					const data = await response.json();

					if (!response.ok) {
						if (response.status === 401) {
							throw new Error(data.mensaje || 'El token ingresado es inválido o ha expirado');
						} else if (response.status === 404) {
							throw new Error(data.mensaje || 'El usuario ingresado es inválido');
						} else {
							throw new Error(data.mensaje || 'Error al cambiar la contraseña');
						}
					}

					return data;
				} catch (error) {
					throw new Error(error.message || 'Error al enviar la solicitud');
				}
			},
			//Funciones para la gestion de pacientes
			createUser: async (body) => {
				try {
					if (!body.username || !body.name || !body.lastname || !body.dni || !body.phone || !body.email) {
						throw new Error("Por favor, complete todos los campos requeridos.");
					}
					const resp = await getActions().protectedFetch("/signup", "POST", body);

					if (resp.ok) {
						const data = await resp.json();
						const newUser = {
							id: data.role_id,
							username: data.username,
							name: data.name,
							lastname: data.lastname,
							dni: data.dni,
							phone: data.phone,
							email: data.email,
							virtual_link: data.virtual_link
						};
						const updatedUserList = [...getStore().user, newUser];
						setStore({ user: updatedUserList });
						return data;
					} else {
						const errorMessage = await resp.text();
						throw new Error(errorMessage || "Error al crear el usuario.");
					}
				} catch (error) {
					console.error("Error creating user:", error);
					throw error;
				}
			},
			getUsers: async () => {
				try {
					const resp = await getActions().protectedFetch("/users", "GET");

					if (resp.ok) {
						const data = await resp.json();
						setStore({ user: data });
						return data;
					} else {
						throw new Error("Error al obtener usuarios.");
					}
				} catch (error) {
					console.error("Error al obtener usuarios:", error.message);
					throw error;
				}
			},
			getUser: async (id) => {
				try {
					const resp = await getActions().protectedFetch(`/get_user/${id}`);
					if (resp.ok) {
						const data = await resp.json();
						return data;
					} else {
						throw new Error("Error al obtener el usuario.");
					}
				} catch (error) {
					console.error("Error al obtener usuarios:", error.message);
					throw error;
				}
			},
			editUser: async (id, userData) => {
				try {
					const resp = await getActions().protectedFetch(`/edit_user/${id}`, 'PUT', userData);
					if (resp.ok) {
						const userIndex = getStore().user.findIndex(user => user.id === id);
						if (userIndex !== -1) {
							const updatedUsers = [...getStore().user];
							updatedUsers[userIndex] = { ...userData, id };
							setStore({ user: updatedUsers });
							return { ...userData, id };
						} else {
							throw new Error('Usuario no encontrado');
						}
					} else {
						throw new Error('Error al editar el usuario');
					}
				} catch (error) {
					console.error("Error al editar el usuario:", error.message);
					throw error;
				}
			},
			//Funciones para la edicion de perfil		
			getUserData: async () => {
				try {
					const resp = await getActions().protectedFetch("/profile", "GET", null)
					if (!resp.ok) {
						console.error("Error al traer datos de usuario: ", resp)
						return { error: "Error al traer datos de usuario" }
					}
					return resp.json()
				} catch (error) {
					console.error("Error: ", error)
					return { error: "Error al traer datos de usuario" }
				}
			},
			editProfile: async (changes) => {
				try {
					const resp = await getActions().protectedFetch("/profile_edit", "PUT", changes)

					if (!resp.ok) {
						throw new Error("No se pudo actualizar el perfil")
					}

					return await resp.json()

				} catch (error) {
					console.error("Error al actualizar el perfil: ", error)
					throw error
				}
			},
			//Funciones para el envio y lectura de consultas externas
			sendMessage: async (name, lastname, age, phone, consultation, arrival_date) => {
				try {
					const response = await getActions().apiFetch('/message', 'POST', {
						name: name,
						lastname: lastname,
						age: age,
						phone: phone,
						consultation: consultation,
						arrival_date: arrival_date
					});

					if (!response.ok) {
						throw new Error('Failed to send message');
					}
					const responseData = await response.json();
					return responseData;
				} catch (error) {
					console.error("Error al realizar la solicitud:", error);
					throw new Error(`Error de red: ${error.message}`);
				}
			},
			getConsultations: async () => {
				try {
					const response = await getActions().protectedFetch('/consultations', 'GET');
					if (response.ok) {
						const data = await response.json();
						setStore({ consultations: data });
						return data;
					} else {
						throw new Error("Error al obtener las consultas.");
					}
				} catch (error) {
					console.error("Error al obtener las consultas:", error.message);
					throw error;
				}
			},
			getOneConsultation: async (id) => {
				try {
					const resp = await getActions().protectedFetch(`/consultation/${id}`);
					if (resp.ok) {
						const data = await resp.json();
						return data;
					} else {
						throw new Error("Error al obtener el usuario.");
					}
				} catch (error) {
					console.error("Error al obtener usuarios:", error.message);
					throw error;
				}
			},
			changeStatusConsultation: async (id) => {
				try {
					const response = await getActions().protectedFetch(`/consultations/${id}/mark_as_unread`, 'PUT');
					if (response.ok) {
						return response.json();
					} else {
						throw new Error('Error al marcar la consulta como no leída');
					}
				} catch (error) {
					console.error("Error al marcar la consulta como no leída:", error.message);
					throw error;
				}
			},
			markConsultationAsRead: async (id) => {
				try {
					const response = await getActions().protectedFetch(`/consultations/${id}/mark_as_read`, 'PUT');
					if (response.ok) {
						return response.json();
					} else {
						throw new Error('Error al marcar la consulta como no leída');
					}
				} catch (error) {
					console.error("Error al marcar la consulta como no leída:", error.message);
					throw error;
				}
			},
			logicalDeletionMessage: async (id) => {
				try {
					const response = await getActions().protectedFetch(`/deleted_consultations/${id}`, 'PUT');
					if (response.ok) {
						return response;
					} else {
						throw new Error('Error al eliminar el mensaje');
					}
				} catch (error) {
					console.error("Error al eliminar el mensaje:", error.message);
					throw error;
				}
			},
			physicalDeletionMessage: async (id) => {
				try {
					const response = await getActions().protectedFetch(`/deleted_consultations/${id}`, 'DELETE');
					if (response.ok) {
						return response.json();
					} else {
						throw new Error('Error al eliminar el mensaje de forma permanente');
					}
				} catch (error) {
					console.error("Error al eliminar el mensaje:", error.message);
					throw error;
				}
			},
			createPreference: async () => {
				try {
					const response = await getActions.protectedFetch("/create_preference", "POST", {
						description: "Honorarios",
						price: 100,
						quantity: 1,
						currency_id: "ARS"
					})

					if (response.ok) {
						console.log("El response vino ok del back end y tiene esta info: ", response)
						const data = await response.json();
						const { id } = data;
						console.log("ESTE ES EL FAMOSO ID: ", id)
						let store = getStore()
						setStore({ ...store, preferenceId: id })
						let store2 = getStore()
						console.log("Este es el contenido de id en el store: ", store2.preferenceId.id)
						return id;
					} else {
						console.error("Error creating preference, o sea response.ok dio false en flux.js");
					}
				} catch (error) {
					console.error(error);
				}

			},
			//Funciones para el bloqueo de fechas individuales
			blockMultipleHours: async (dates) => {
				try {
					const data = {
						dates: dates
					};

					const response = await getActions().apiFetch('/block_multiple_hours', 'POST', data);

					if (response && response.message) {
						console.log('Horas bloqueadas con éxito:', response.message);
					} else {
						console.error('Error al bloquear horas:', response.error);
					}
				} catch (error) {
					console.error('Error al bloquear horas:', error);
				}
			},
			getBlockedDates: async () => {
				try {
					const response = await getActions().apiFetch('/bloquear', 'GET');
					if (response && response.length > 0) {
						console.log('Fechas bloqueadas obtenidas con éxito:', response);
						return response;
					} else {
						console.log('No hay fechas bloqueadas disponibles.');
						return [];
					}
				} catch (error) {
					console.error('Error al obtener fechas bloqueadas:', error);
					throw error;
				}
			},
			//Funciones para el bloqueo de fechas globales
			addGlobalEnabled: async (data) => {
				try {
					const response = await getActions().apiFetch('/global_enabled', 'POST', data);

					if (!response.ok) {
						throw new Error('Error al agregar disponibilidad global');
					}
					const responseData = await response.json();
					const updatedGlobalEnabled = [...getStore().globalEnabled, ...responseData];
					setStore({ globalEnabled: updatedGlobalEnabled });
					return responseData;
				} catch (error) {
					console.error("Error al agregar disponibilidad global:", error);
					const errorMessage = error.message || 'Error de red';
					return { success: false, error: errorMessage };
				}
			},
			getGlobalEnabled: async () => {
				try {
					const resp = await getActions().apiFetch('/get_global_enabled', 'GET');
					if (resp.ok) {
						const data = await resp.json();
						setStore({ globalEnabled: data });
						return data;
					} else {
						throw new Error("Error al obtener los datos de disponibilidad global.");
					}
				} catch (error) {
					console.error("Error al obtener los datos de disponibilidad global:", error.message);
					throw error;
				}
			},
			getGlobalEnabledByDay: async (day) => {
				try {
					const resp = await getActions().apiFetch(`/get_global_enabled_by_day/${day}`, 'GET');
					if (resp.ok) {
						const data = await resp.json();
						setStore({ globalEnabledByDay: data });
						return data;
					} else {
						throw new Error("Error al obtener los datos de disponibilidad global por día.");
					}
				} catch (error) {
					console.error("Error al obtener los datos de disponibilidad global por día:", error.message);
					throw error;
				}
			},
			deleteGlobalEnabled: async (id) => {
				try {
					const resp = await getActions().apiFetch(`/delete_global_enabled/${id}`, 'DELETE');
					if (resp.ok) {
						const data = await resp.json();
						const updatedGlobalEnabled = getStore().globalEnabled.filter(item => item.id !== id);
						setStore({ globalEnabled: updatedGlobalEnabled });
						return data;
					} else {
						throw new Error("Error al eliminar el registro de disponibilidad global.");
					}
				} catch (error) {
					console.error("Error al eliminar el registro de disponibilidad global:", error.message);
					throw error;
				}
			}
		}
	}
};

export default getState;