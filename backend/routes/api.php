<?php
use App\Http\Controllers\CameraUploadController;

use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\BodyController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\BlogCategoryController;
use App\Http\Controllers\BlogController;
use App\Http\Controllers\EventCategoryController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\Form\AnswerController;
use App\Http\Controllers\Form\QuestionController;
use App\Http\Controllers\LogoController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OperationalController;
use App\Http\Controllers\Form\PeriodController;
use App\Http\Controllers\Form\ResultController;
use App\Http\Controllers\ProductCategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductPromotionController;
use App\Http\Controllers\RoleController;
use App\Http\Controllers\RouteController;
use App\Http\Controllers\LandingController;
use App\Http\Controllers\ThemeController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\InvoiceController;
use App\Http\Controllers\WhatsappController;
use App\Http\Controllers\BankController;
use App\Http\Controllers\ClassroomController;
use App\Http\Controllers\ClassroomMaterialController;
use App\Http\Controllers\ClassroomAssignmentController;
use App\Http\Controllers\ClassroomAttendanceController;
use App\Http\Controllers\AssignmentQuestionController;
use App\Http\Controllers\AssignmentAnswerController;
use App\Http\Controllers\GalleryController;
use App\Http\Controllers\LiveChatSettingController;
use App\Http\Controllers\Api\OrganizationStructureController;
use App\Http\Controllers\WhatsAppNotificationController;
use App\Http\Controllers\ServiceSubItemController;
use App\Http\Controllers\ServiceController;

use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;
use Jenssegers\Agent\Agent;
use Carbon\Carbon;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
 */
Route::post('/send-whatsapp', [WhatsappController::class, 'sendWhatsappNotification']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
Route::post('/request-login-otp', [AuthController::class, 'requestLoginOtp']);
Route::post('/request-password-reset-otp', [AuthController::class, 'requestPasswordResetOtp']);
Route::post('/login/otp', [AuthController::class, 'requestLoginOtp']);
Route::post('/change-password', [AuthController::class, 'changePassword']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
Route::middleware('auth:sanctum')->post('/user/update-last-online', [AuthController::class, 'updateLastOnline']);



/*
|--------------------------------------------------------------------------
| Service Routes
|--------------------------------------------------------------------------
*/

// Public (tanpa auth)
Route::get('services', [ServiceController::class, 'index']);
Route::get('services/{service}', [ServiceController::class, 'show']);

// Protected (hanya admin / super admin)
Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
    Route::post('services', [ServiceController::class, 'store']);
    Route::put('services/{service}', [ServiceController::class, 'update']);
    Route::delete('services/{service}', [ServiceController::class, 'destroy']);
    Route::get('/is-authenticated', [AuthController::class, 'isAuthenticated']);
});

/*
|--------------------------------------------------------------------------
| Service SubItem Routes
|--------------------------------------------------------------------------
*/

// Public
Route::get('services/{service}/sub-items', [ServiceSubItemController::class, 'index']);
Route::get('services/{service}/sub-items/{subItem}', [ServiceSubItemController::class, 'show']);

// Protected
Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
    Route::post('services/{service}/sub-items', [ServiceSubItemController::class, 'store']);
    Route::put('services/{service}/sub-items/{subItem}', [ServiceSubItemController::class, 'update']);
    Route::delete('services/{service}/sub-items/{subItem}', [ServiceSubItemController::class, 'destroy']);
});

Route::prefix('logo')->group(function () {
    Route::controller(LogoController::class)->group(function () {
        Route::get('/', 'show');
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
            Route::post('/', 'update');
        });
    });
});
Route::prefix('livechat-settings')->group(function () {
    Route::controller(LiveChatSettingController::class)->group(function () {
        Route::get('/', 'get');
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
            Route::post('/', 'update');
        });

    });
});

Route::prefix('theme')->group(function () {
    Route::controller(ThemeController::class)->group(function () {
        Route::get('/show', 'show');
        Route::get('/', 'index');
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
            Route::post('/', 'update');
        });
    });
});
Route::prefix('contact')->group(function () {
    Route::controller(ContactController::class)->group(function () {
        Route::get('/', 'show');
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
            Route::post('/', 'update');
        });
    });
});
Route::prefix('whatsapp-notifications')->group(function () {
    Route::get('/', [WhatsAppNotificationController::class, 'index']);
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {

        Route::post('/', [WhatsAppNotificationController::class, 'store']);
        Route::get('/{id}', [WhatsAppNotificationController::class, 'show']);
        Route::put('/{id}', [WhatsAppNotificationController::class, 'update']);
        Route::delete('/{id}', [WhatsAppNotificationController::class, 'destroy']);
    });

});

Route::prefix('organization-structures')->group(function () {
    Route::get('/', [OrganizationStructureController::class, 'index']);
    Route::post('/', [OrganizationStructureController::class, 'store']);
    Route::put('/{id}', [OrganizationStructureController::class, 'update']);
    Route::delete('/{id}', [OrganizationStructureController::class, 'destroy']);
});
Route::get('/operational', [OperationalController::class, 'index']);
Route::get('/banners', [GalleryController::class, 'index']);
Route::get('/banners/view/{id?}', [GalleryController::class, 'view']);

Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
    Route::post('/banners', [GalleryController::class, 'store']);
    Route::post('/banners/{id}', [GalleryController::class, 'update']);
    Route::delete('/banners/{id}', [GalleryController::class, 'delete']);
});



Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
    Route::put('/operational', [OperationalController::class, 'update']);
});

Route::prefix('body')->group(function () {
    Route::controller(BodyController::class)->group(function () {
        Route::get('/', 'show');
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
            Route::post('/', 'update');
        });
    });
});
Route::prefix('blog')->group(function () {
    Route::prefix('category')->group(function () {
        Route::controller(BlogCategoryController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('/{id}', 'view');
            Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
                Route::post('/', 'store');
                Route::post('/{id}', 'update');
                Route::delete('/{id}', 'delete');
            });
        });
    });
    Route::controller(BlogController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/{key}', 'view');
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
            Route::post('/', 'store');
            Route::post('/{key}', 'update');
            Route::delete('/{id}', 'delete');
        });
    });
});


Route::prefix('event')->group(function () {
    Route::prefix('category')->group(function () {
        Route::controller(EventCategoryController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('/{id}', 'view');
            Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
                Route::post('/', 'store');
                Route::post('/{id}', 'update');
                Route::delete('/{id}', 'delete');
            });
        });
    });
    Route::controller(EventController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/{key}', 'view');
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
            Route::post('/', 'store');
            Route::post('/{key}', 'update');
            Route::delete('/{id}', 'delete');
        });
    });
});
// Route::prefix('checkout')->group(function () {
//     Route::controller(CheckoutController::class)->group(function () {
//         Route::get('/', 'index'); // List all checkouts for the user
//         Route::get('/{checkoutId}', 'view'); // View a specific checkout

//         Route::middleware('auth:sanctum')->group(function () {
//             Route::post('/', 'create');
//             Route::post('/code', 'checkCode');
//             Route::patch('/{checkoutId}/payment', 'updatePaymentStatus');
//             Route::delete('/{checkoutId}', 'delete');
//         });
//     });
// });


// secure file access for assignment
// Route::get('/secure-file/{hash}', [ClassroomAssignmentController::class, 'secureFileAccess'])
//     ->name('secure.file.access')
//     ->where('hash', '[A-Za-z0-9_-]+');

// Route::get('/secure-download/{hash}', [ClassroomAssignmentController::class, 'secureFileDownload'])
//     ->name('secure.file.download')
//     ->where('hash', '[A-Za-z0-9_-]+');

Route::prefix('classrooms')->group(function () {
    Route::middleware(['auth:sanctum'])->group(function () {

        // Classroom CRUD
        Route::get('/', [ClassroomController::class, 'index']);
        Route::post('/', [ClassroomController::class, 'store']);
        Route::get('/{code}', [ClassroomController::class, 'show']);
        Route::put('/{code}', [ClassroomController::class, 'update']);
        Route::delete('/{code}', [ClassroomController::class, 'destroy']);

        // Teacher management
        Route::post('/{code}/teachers', [ClassroomController::class, 'addTeacher']);
        Route::delete('/{code}/teachers/{teacherId}', [ClassroomController::class, 'removeTeacher']);
        Route::get('/{code}/available-teachers', [ClassroomController::class, 'availableTeachers']);

        // Student management
        Route::post('/{code}/students', [ClassroomController::class, 'addStudent']);
        Route::post('/{code}/students/bulk', [ClassroomController::class, 'addMultipleStudents']);
        Route::delete('/{code}/students/{studentId}', [ClassroomController::class, 'removeStudent']);
        Route::put('/{code}/students/{studentId}', [ClassroomController::class, 'updateStudentStatus']);
        Route::get('/{code}/available-students', [ClassroomController::class, 'availableStudents']);
    });

    Route::prefix('materials')->group(function () {
        Route::get('/secure-file/{hash}', [ClassroomMaterialController::class, 'secureFileAccess'])
            ->name('material.secure.file.access')
            ->where('hash', '[A-Za-z0-9_-]+');

        Route::get('/secure-download/{hash}', [ClassroomMaterialController::class, 'secureFileDownload'])
            ->name('material.secure.file.download')
            ->where('hash', '[A-Za-z0-9_-]+');
    });

    Route::prefix('{code}/materials')->group(function () {

        Route::middleware(['auth:sanctum'])->group(function () {

            Route::get('/', [ClassroomMaterialController::class, 'index']);
                Route::post('/', [ClassroomMaterialController::class, 'store']);
                Route::get('/{materialId}', [ClassroomMaterialController::class, 'show']);
                Route::put('/{materialId}', [ClassroomMaterialController::class, 'update']);
                Route::delete('/{materialId}', [ClassroomMaterialController::class, 'destroy']);
                Route::post('/{materialId}/download', [ClassroomMaterialController::class, 'downloadFile']);
                Route::post('/{materialId}/view', [ClassroomMaterialController::class, 'incrementView']);
                Route::post('/statistics', [ClassroomMaterialController::class, 'getStatistics']);
                Route::get('/files/{fileId}/view', [ClassroomMaterialController::class, 'viewFile']);
                Route::get('/links/{fileId}/view', [ClassroomMaterialController::class, 'viewLink']);
                Route::get('/files/{fileId}/view-or-link', [ClassroomMaterialController::class, 'viewFileOrLink']);
                Route::post('/links/{fileId}/view', [ClassroomMaterialController::class, 'viewExternalLink']);

        });
    });
      // ==================== ATTENDANCE ROUTES ====================
    Route::prefix('{code}/attendance')->group(function () {
        Route::middleware(['auth:sanctum'])->group(function () {

            // Meeting management
            Route::get('meetings', [ClassroomAttendanceController::class, 'getMeetings']);
            Route::post('meetings', [ClassroomAttendanceController::class, 'createMeeting']);
            Route::get('meetings/{meetingId}', [ClassroomAttendanceController::class, 'getMeetingDetail']);
            Route::put('meetings/{meetingId}', [ClassroomAttendanceController::class, 'updateMeeting']);
            Route::delete('meetings/{meetingId}', [ClassroomAttendanceController::class, 'deleteMeeting']);
            Route::post('meetings/{meetingId}/duplicate', [ClassroomAttendanceController::class, 'duplicateMeeting']);

            // Meeting status management
            Route::put('meetings/{meetingId}/status', [ClassroomAttendanceController::class, 'updateMeetingStatus']);
            Route::post('meetings/{meetingId}/start', [ClassroomAttendanceController::class, 'startMeeting']);
            Route::post('meetings/{meetingId}/complete', [ClassroomAttendanceController::class, 'completeMeeting']);
            Route::post('meetings/{meetingId}/cancel', [ClassroomAttendanceController::class, 'cancelMeeting']);

            // Attendance management
            Route::put('meetings/{meetingId}/attendance', [ClassroomAttendanceController::class, 'updateAttendance']);
            Route::post('meetings/{meetingId}/attendance/bulk', [ClassroomAttendanceController::class, 'bulkUpdateAttendance']);
            Route::get('meetings/{meetingId}/attendance/export', [ClassroomAttendanceController::class, 'exportMeetingAttendance']);

            // Individual attendance actions
            Route::get('{attendanceId}', [ClassroomAttendanceController::class, 'getAttendanceDetail']);
            Route::put('{attendanceId}', [ClassroomAttendanceController::class, 'updateIndividualAttendance']);

            // Attendance notes
            Route::post('{attendanceId}/notes', [ClassroomAttendanceController::class, 'addAttendanceNote']);
            Route::put('{attendanceId}/notes/{noteId}', [ClassroomAttendanceController::class, 'updateAttendanceNote']);
            Route::delete('{attendanceId}/notes/{noteId}', [ClassroomAttendanceController::class, 'deleteAttendanceNote']);
            Route::get('{attendanceId}/notes', [ClassroomAttendanceController::class, 'getAttendanceNotes']);

            // Student-specific routes
            Route::get('students/{studentId}/summary', [ClassroomAttendanceController::class, 'getStudentAttendanceSummary']);
            Route::get('students/{studentId}/history', [ClassroomAttendanceController::class, 'getStudentAttendanceHistory']);
            Route::get('students/{studentId}/analytics', [ClassroomAttendanceController::class, 'getStudentAttendanceAnalytics']);
            Route::post('students/{studentId}/excuse', [ClassroomAttendanceController::class, 'excuseStudent']);

            // Statistics and analytics
            Route::get('statistics', [ClassroomAttendanceController::class, 'getAttendanceStatistics']);
            Route::get('analytics', [ClassroomAttendanceController::class, 'getAttendanceAnalytics']);
            Route::get('trends', [ClassroomAttendanceController::class, 'getAttendanceTrends']);

            // Reports
            Route::get('reports/daily', [ClassroomAttendanceController::class, 'getDailyReport']);
            Route::get('reports/weekly', [ClassroomAttendanceController::class, 'getWeeklyReport']);
            Route::get('reports/monthly', [ClassroomAttendanceController::class, 'getMonthlyReport']);
            Route::get('reports/summary', [ClassroomAttendanceController::class, 'getSummaryReport']);
            Route::get('reports/export', [ClassroomAttendanceController::class, 'exportAttendanceReport']);

            // Meeting materials (link meetings to materials)
            Route::post('meetings/{meetingId}/materials', [ClassroomAttendanceController::class, 'attachMaterialsToMeeting']);
            Route::delete('meetings/{meetingId}/materials/{materialId}', [ClassroomAttendanceController::class, 'detachMaterialFromMeeting']);
            Route::get('meetings/{meetingId}/materials', [ClassroomAttendanceController::class, 'getMeetingMaterials']);

            // Calendar integration
            Route::get('calendar', [ClassroomAttendanceController::class, 'getAttendanceCalendar']);
            Route::get('calendar/events', [ClassroomAttendanceController::class, 'getCalendarEvents']);
        });
    });

    // assignments
    Route::prefix('assignments')->group(function () {
        Route::get('/secure-file/{hash}', [ClassroomAssignmentController::class, 'secureFileAccess'])
            ->name('assignments.secure.file.access')
            ->where('hash', '[A-Za-z0-9_-]+');

        Route::get('/secure-download/{hash}', [ClassroomAssignmentController::class, 'secureFileDownload'])
            ->name('assignment.secure.file.download')
            ->where('hash', '[A-Za-z0-9_-]+');
    });

    Route::prefix('assignments/submissions')->group(function () {
        Route::get('/secure-file/{hash}', [ClassroomAssignmentController::class, 'secureFileAccessSubmissions'])
            ->name('secure.submission.file.access')
            ->where('hash', '[A-Za-z0-9_-]+');

        Route::get('/secure-download/{hash}', [ClassroomAssignmentController::class, 'secureFileDownloadSubmissions'])
            ->name('secure.submission.file.download')
            ->where('hash', '[A-Za-z0-9_-]+');
    });

    Route::prefix('{code}/assignments')->group(function () {
        Route::middleware(['auth:sanctum'])->group(function () {
            // Submission routes
            Route::get('/{assignmentId}/submission', [ClassroomAssignmentController::class, 'getSubmission']);
            Route::post('/{assignmentId}/submit', [ClassroomAssignmentController::class, 'submitAssignment']);
            Route::delete('/{assignmentId}/submission/files/{fileId}', [ClassroomAssignmentController::class, 'removeSubmissionFile']);

            // NEW: Route untuk update submission (grading)
            Route::put('/{assignmentId}/submissions/{submissionId}', [ClassroomAssignmentController::class, 'updateSubmission']);

            // Assignment CRUD routes
            Route::get('/', [ClassroomAssignmentController::class, 'index']);
            Route::post('/', [ClassroomAssignmentController::class, 'store']);
            Route::get('/{assignmentId}', [ClassroomAssignmentController::class, 'show']);
            Route::put('/{assignmentId}', [ClassroomAssignmentController::class, 'update']);
            Route::delete('/{assignmentId}', [ClassroomAssignmentController::class, 'destroy']);

            // File handling routes
            Route::post('/{assignmentId}/download', [ClassroomAssignmentController::class, 'downloadFile']);
            Route::post('/{assignmentId}/view', [ClassroomAssignmentController::class, 'incrementView']);
            Route::post('/statistics', [ClassroomAssignmentController::class, 'getStatistics']);
            Route::get('/files/{fileId}/view', [ClassroomAssignmentController::class, 'viewFile']);
            Route::get('/links/{fileId}/view', [ClassroomAssignmentController::class, 'viewLink']);
            Route::get('/files/{fileId}/view-or-link', [ClassroomAssignmentController::class, 'viewFileOrLink']);
            Route::post('/links/{fileId}/view', [ClassroomAssignmentController::class, 'viewExternalLink']);
        });
    });
});



Route::prefix('cart')->middleware('auth:sanctum')->group(function () {
    Route::get('/', [CartController::class, 'index']);
    Route::post('/add', [CartController::class, 'add']);
    Route::put('/{cartItemId}', [CartController::class, 'update']);
    Route::delete('/{cartItemId}', [CartController::class, 'remove']);
});
Route::get('/invoice/image/{filename}', [InvoiceController::class, 'showImage'])
    ->where('filename', '[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)');

// Routes yang butuh auth
Route::middleware(['auth:sanctum'])->group(function () {
    Route::prefix('invoice')->group(function () {
        Route::get('/', [InvoiceController::class, 'index']);
        Route::get('{checkoutKey}', [InvoiceController::class, 'show']);
        Route::post('{checkoutKey}', [InvoiceController::class, 'createOrUpdate']);
        Route::delete('{checkoutKey}', [InvoiceController::class, 'destroy']);
    });
});
Route::middleware(['auth:sanctum'])->group(function () {
    Route::prefix('checkout')->group(function () {
        Route::get('/', [CheckoutController::class, 'index']);
        Route::post('/', [CheckoutController::class, 'create']);
        Route::get('/payment-methods', [CheckoutController::class, 'getPaymentMethods']);
        Route::post('/code', [CheckoutController::class, 'checkCode']);
        Route::post('/bulk-delete', [CheckoutController::class, 'bulkDelete']);

        // Routes dengan checkout key
        Route::get('/{key}', [CheckoutController::class, 'view']);
        Route::get('/{key}/snap-token', [CheckoutController::class, 'getSnapToken']);
        Route::get('/{key}/payment-status', [CheckoutController::class, 'checkPaymentStatus']);
        Route::put('/{key}/change-payment-method', [CheckoutController::class, 'changePaymentMethod']);
        Route::post('/{key}/recreate', [CheckoutController::class, 'recreateFromExpired']);
        Route::post('/{key}/regenerate-payment', [CheckoutController::class, 'regeneratePayment']);

        // Routes dengan ID (untuk backward compatibility)
        Route::put('/{id}/payment', [CheckoutController::class, 'updatePaymentStatus']);
        Route::delete('/{id}', [CheckoutController::class, 'delete']);
    });
});

// Menggunakan checkout key di URL path
Route::get('/checkout/{key}/finish', [CheckoutController::class, 'paymentFinish'])->name('checkout.payment.finish');
Route::get('/checkout/{key}/unfinish', [CheckoutController::class, 'paymentUnfinish'])->name('checkout.payment.unfinish');
Route::get('/checkout/{key}/error', [CheckoutController::class, 'paymentError'])->name('checkout.payment.error');

// API endpoint sebagai fallback (optional)
Route::get('/checkout/payment-finish-api', [CheckoutController::class, 'paymentFinishApi'])->name('checkout.payment.finish.api');

// Webhook dari Midtrans
Route::post('/checkout/midtrans/notification', [CheckoutController::class, 'midtransNotification']);

Route::prefix('bank')->group(function () {
      Route::controller(BankController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/{key}', 'view');
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
            Route::post('/', 'store');
            Route::post('/{key}', 'update');
            Route::delete('/{id}', 'delete');
        });
    });
});
Route::prefix('product')->group(function () {
    Route::prefix('promotion')->group(function () {
        Route::controller(ProductPromotionController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('/{id}', 'view');
            Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
                Route::post('/', 'store');
                Route::post('/{id}', 'update');
                Route::delete('/{id}', 'delete');
            });
        });
    });

    Route::prefix('category')->group(function () {
        Route::controller(ProductCategoryController::class)->group(function () {
            Route::get('/', 'index');
            Route::get('/{id}', 'view');
            Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
                Route::post('/', 'store');
                Route::post('/{id}', 'update');
                Route::delete('/{id}', 'delete');
                // Add bulk delete route
                Route::post('/bulk-delete', 'bulkDelete');
            });
        });
    });

    Route::controller(ProductController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/{key}', 'view');
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {
            Route::post('/', 'store');
            Route::post('/{key}', 'update');
            Route::delete('/{id}', 'delete');
        });
    });
});


Route::prefix('routes')->group(function () {

    // Public routes
    Route::get('/all', [RouteController::class, 'all']); // untuk fetchAllRoutes
    Route::get('/', [RouteController::class, 'index']);  // fetch paginated
    Route::get('/{id}', [RouteController::class, 'show']); // fetch single route

    // Protected routes (admin only)
    Route::middleware(['role:administrator|super admin'])->group(function () {
        Route::post('/', [RouteController::class, 'store']);   // create route
        Route::put('/{id}', [RouteController::class, 'update']); // update route
        Route::delete('/{id}', [RouteController::class, 'destroy']); // delete route
    });
});

Route::prefix('landings')->group(function () {
    Route::controller(LandingController::class)->group(function () {

        Route::get('/all', 'all');
        Route::get('/', 'index');
        Route::get('/{id}', 'view');

        Route::middleware('auth:sanctum')->group(function () {

            Route::middleware(['role:administrator|super admin'])->group(function () {
                Route::post('/', 'store');
                Route::put('/{id}', 'update');
                Route::delete('/{id}', 'destroy');
            });
        });
    });
});
Route::middleware('auth:sanctum')->group(function () {
    Route::middleware('check.status')->group(function () {

        Route::prefix('roles')->group(function () {
            Route::controller(RoleController::class)->group(function () {

                Route::get('/', 'index');
                Route::get('/all', 'all');
                Route::get('/{key}', 'view');

                Route::middleware(['check.status', 'role:administrator|super admin'])->group(function () {
                    Route::post('/', 'store');
                    Route::post('/{name}', 'update');
                    Route::delete('/{id}', 'delete');
                });
            });
        });


        Route::prefix('/users')->group(function () {
            Route::controller(UserController::class)->group(function () {
                Route::get('/all', 'all');
                Route::get('/', 'index');
                Route::post('/update-password/{id}', 'updatePassword');
                Route::get('/{email}', 'view');
                Route::post('/{id}', 'update');
                Route::middleware(['check.status', 'role:administrator|super admin'])->group(function () {
                    Route::post('/', 'store');
                    Route::delete('/{id}', 'delete');
                });
            });
        });
        Route::prefix('notifications')->group(function () {
            Route::controller(NotificationController::class)->group(function () {
                Route::get('/', 'index');
                Route::get('/all', 'fetchAll');
                Route::get('/{id}', 'view');
                Route::middleware('check.status')->group(function () {
                    Route::post('/', 'winStore');
                    Route::post('/{id}', 'update');
                    Route::delete('/{id}', 'delete');
                });
            });
        });
    });
});

Route::get('/onload', [AuthController::class, 'onload']);
Route::post('/logout', [AuthController::class, 'logout']);
Route::prefix('enggang/answer')->group(function () {
    Route::controller(AnswerController::class)->group(function () {
        Route::post('/get-graduation-status', 'getGraduationStatus');
    });
});
// Route untuk serve file form answers


// Route untuk serve file form answers
Route::get('/form-answers/{filename}', [AnswerController::class, 'serveFile'])
    ->where('filename', '[a-f0-9]{64}\.(pdf|doc|docx|xls|xlsx|txt|png|jpg|jpeg|webp)')
    ->name('form-answers.serve');

Route::get('/users/{id}', [ChatController::class, 'getUserById']);

Route::middleware('auth:sanctum')->group(function () {
    // Chat Rooms
    Route::get('/chat-rooms', [ChatController::class, 'getChatRooms']);
    Route::get('/chat-rooms/{id}', [ChatController::class, 'showChatRoom']);

    // Messages
    Route::get('/messages/{chatRoomId}', [ChatController::class, 'getMessagesForRoom']);
    Route::post('/send-message', [ChatController::class, 'sendMessage']);
    Route::delete('/messages/{id}', [ChatController::class, 'deleteMessage']);

    // Unread Counts
    Route::get('/unread-counts/{userId}', [ChatController::class, 'getUnreadCount']);
    Route::get('/messages/unread-count/{chatRoomId}/{userId}', [ChatController::class, 'getUnreadCount']);
    Route::post('/messages/delivered', [ChatController::class, 'markMessagesAsDelivered']);
    Route::post('/messages/read', [ChatController::class, 'markMessagesAsRead']);
    Route::get('/last-message/{chatRoomId}', [ChatController::class, 'getLastMessage']);

    // Undelivered Messages
    Route::get('/messages/undelivered/{userId}', [ChatController::class, 'getUndeliveredMessages']);
    Route::get('/get-users', [ChatController::class, 'getUsers']);
    Route::post('/chat-rooms', [ChatController::class, 'createChatRoom']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('login-check', function (Request $request) {
        $user = $request->user();

        if ($user) {
            $agent = new Agent();
            $agent->setUserAgent($request->header('User-Agent'));

            $device = [
                'platform' => $agent->platform(),
                'platform_version' => $agent->version($agent->platform()),
                'browser' => $agent->browser(),
                'browser_version' => $agent->version($agent->browser()),
                'is_mobile' => $agent->isMobile(),
                'is_desktop' => $agent->isDesktop(),
            ];

            // helper format ISO8601 Asia/Jakarta
           $formatDate = function ($date) {
                if (!$date) return null;

                $carbon = Carbon::parse($date)->timezone('Asia/Jakarta');
                return $carbon->isToday()
                    ? $carbon->format('H:i') . ' WIB'   // contoh: 14:32 WIB
                    : $carbon->diffForHumans();         // contoh: 2 days ago
            };

            // update last online di DB pake now()
            $user->last_online_at = now('Asia/Jakarta');
            $user->save();

            $userData = [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone_number' => $user->phone_number,
                'avatar' => $user->avatar,
                'registered' => $formatDate($user->created_at),
                'last_online_at' => $formatDate($user->last_online_at),
                'created_at' => $user->created_at,
                'status' => $user->status,
                'status_account' => $user->status_account,
                'role' => $user->roles[0]->name ?? 'No role assigned',
                'device' => $device,
            ];

            return response()->json([
                'user' => $userData,
                'message' => 'Token is valid'
            ], 200);
        }

        return response()->json(['message' => 'Unauthenticated.'], 401);
    });
});
Route::get('verify-token', function (Request $request) {
    $user = Auth::user();
    if ($user) {
        return response()->json(['message' => 'Token is valid'], 200);
    } else {
        return response()->json(['message' => 'Unauthenticated.'], 401);
    }
});

Route::prefix('ppdb/period')->group(function () {
    Route::controller(PeriodController::class)->group(function () {
        Route::get('/all', 'all');
        Route::get('/', 'index');
        Route::get('/{key}', 'view');
        Route::middleware(['auth:sanctum', 'role:administrator|super admin'])->group(function () {

            Route::post('/', 'store');
            Route::post('/{key}', 'update');
            Route::delete('/{id}', 'delete');
        });
    });
});
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('respondent/result')->group(function () {
        Route::controller(ResultController::class)->group(function () {
            Route::put('/{submissionId}', 'update');
            Route::get('/get-periods', 'listPeriods');
            Route::get('/{submissionId}', 'show');
            Route::post('/verify/{submissionId}', 'verify');
        });
    });
});


Route::prefix('enggang/answer')->group(function () {
    Route::controller(AnswerController::class)->group(function () {

        Route::get('/group/respondent/public', 'getGroupedAnswers');


        Route::middleware('auth:sanctum')->group(function () {
            // chart
            Route::get('/group/respondent/period', 'getSubmissionsByPeriod');
            Route::get('/group/respondent/period/perday', 'getSubmissionsPerDayByPeriod');
            // chart
            Route::get('/status-totals', 'getStatusTotals');
            Route::get('/group/respondent', 'getGroupedAnswers');
            Route::get('/group/respondent/{submissionId}', 'getBySubmission');
            Route::get('/group/respondent/perday/detail/{periodId}', 'getSubmissionsPerDayDetail');
            Route::post('/get-graduation-status', 'getGraduationStatus');
            Route::post('/', 'submitAnswers');
            Route::post('/respondent/delete/{submissionId}', 'deleteRespondentBySubmission');
            Route::post('/update-submission/{submissionId}', 'updateAnswers');
        });
    });
});
Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('enggang/question')->group(function () {
        Route::controller(QuestionController::class)->group(function () {
            Route::get('/', 'view');
            Route::get('/show', 'show');
            Route::get('/find/{periodKey}', 'find');
            Route::middleware(['role:administrator|super admin'])->group(function () {
                Route::post('/', 'store');
                Route::post('/order', 'updateOrder');
                Route::post('/update/{periodId}', 'update');
                Route::delete('/{id}', 'destroy');
            });
        });
    });
});

Route::middleware('auth:sanctum')->group(function () {
    // === QUESTIONS ===
    Route::prefix('assignments/{assignmentId}/questions')->controller(AssignmentQuestionController::class)->group(function () {
        Route::get('/', 'index');
        Route::get('/find', 'find');
        Route::middleware(['role:administrator|super admin|teacher'])->group(function () {
            Route::post('/', 'store');
            Route::put('/', 'update');
            Route::put('/order', 'updateOrder');
        });
    });
    Route::delete('/questions/{id}', [AssignmentQuestionController::class, 'destroy']);

    // === ANSWERS ===
    Route::prefix('assignments/{assignmentId}')->group(function () {
        // ====== ANSWERS ======
        Route::prefix('answers')->controller(AssignmentAnswerController::class)->group(function () {
            Route::get('/', 'index');   // get semua jawaban user yg login
            Route::post('/', 'store');  // submit/update jawaban user

            Route::middleware(['role:administrator|super admin|teacher'])->group(function () {
                Route::post('/{answerId}/grade', 'gradeAnswer');  // submit/update jawaban user
            });
        });

        // ====== SUMMARY ======
        // Route::get('/summary', [AssignmentSummaryController::class, 'show']);
    });
});
Route::post('/upload-camera', [CameraUploadController::class, 'upload']);

// Protected route with Sanctum authentication
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/upload-camera-auth', [CameraUploadController::class, 'uploadAuth']);
    Route::get('/camera-uploads/my-uploads', [CameraUploadController::class, 'getMyUploads']);
});
Route::get('/camera-uploads/recent', [CameraUploadController::class, 'getRecent'])
    ->middleware(['web']);

Route::get('/camera/{hash}', [CameraUploadController::class, 'showImage'])
    ->name('camera.show')
    ->where('hash', '[A-Za-z0-9_-]+');
