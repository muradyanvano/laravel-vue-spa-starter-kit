<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;

class SpaController extends Controller
{
    /**
     * Serve the Blade SPA shell for browser routes.
     */
    public function __invoke(): View
    {
        return view('app');
    }
}
